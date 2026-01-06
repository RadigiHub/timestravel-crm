"use server";

import { supabaseServer } from "@/lib/supabase/server";
import type { LeadStatus } from "../leads/actions";

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; error: string };

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Unknown error";
}

export type DashboardKPIs = {
  total_leads: number;
  today_new: number;
  followups_due: number; // due today OR overdue
  booked: number;
};

export type PipelineCounts = Record<LeadStatus, number>;

export type AgentRow = {
  agent_id: string;
  agent_name: string;
  total_leads: number;
  booked: number;
  new_today: number;
};

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function startOfTomorrowISO() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.toISOString();
}

export async function getDashboardDataAction(): Promise<
  Ok<{ kpis: DashboardKPIs; pipeline: PipelineCounts; agents: AgentRow[] }> | Fail
> {
  try {
    const supabase = await supabaseServer();

    const todayStart = startOfTodayISO();
    const tomorrowStart = startOfTomorrowISO();

    // 1) Total leads
    const totalRes = await supabase.from("leads").select("id", { count: "exact", head: true });
    if (totalRes.error) return { ok: false, error: totalRes.error.message };
    const total_leads = totalRes.count ?? 0;

    // 2) Today new (created today)
    const todayRes = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart)
      .lt("created_at", tomorrowStart);
    if (todayRes.error) return { ok: false, error: todayRes.error.message };
    const today_new = todayRes.count ?? 0;

    // 3) Booked
    const bookedRes = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "Booked");
    if (bookedRes.error) return { ok: false, error: bookedRes.error.message };
    const booked = bookedRes.count ?? 0;

    // 4) Follow-ups Due (follow_up_at <= end of today)
    // We count any follow_up_at that is <= tomorrowStart (means due today or overdue)
    const fuRes = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .not("follow_up_at", "is", null)
      .lt("follow_up_at", tomorrowStart);
    if (fuRes.error) return { ok: false, error: fuRes.error.message };
    const followups_due = fuRes.count ?? 0;

    // Pipeline counts (grouping in JS)
    const { data: statusRows, error: statusErr } = await supabase.from("leads").select("status");
    if (statusErr) return { ok: false, error: statusErr.message };

    const pipeline: PipelineCounts = {
      New: 0,
      Contacted: 0,
      "Follow-Up": 0,
      Booked: 0,
      Lost: 0,
    };
    for (const r of statusRows ?? []) {
      const s = (r as any).status as LeadStatus;
      if (pipeline[s] != null) pipeline[s] += 1;
    }

    // Agent leaderboard
    // Get agents
    const { data: agents, error: agentsErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "agent");
    if (agentsErr) return { ok: false, error: agentsErr.message };

    // Get leads needed fields
    const { data: leadRows, error: leadErr } = await supabase
      .from("leads")
      .select("agent_id,status,created_at");
    if (leadErr) return { ok: false, error: leadErr.message };

    const agentMap = new Map<string, AgentRow>();

    function label(a: any) {
      const n = (a?.full_name ?? "").trim();
      if (n) return n;
      const e = (a?.email ?? "").trim();
      if (e) return e.split("@")[0] || e;
      return `Agent ${String(a?.id ?? "").slice(0, 8)}`;
    }

    for (const a of agents ?? []) {
      agentMap.set(a.id, {
        agent_id: a.id,
        agent_name: label(a),
        total_leads: 0,
        booked: 0,
        new_today: 0,
      });
    }

    for (const l of leadRows ?? []) {
      const aid = (l as any).agent_id as string | null;
      if (!aid) continue;

      const row = agentMap.get(aid);
      if (!row) continue;

      row.total_leads += 1;

      if ((l as any).status === "Booked") row.booked += 1;

      const createdAt = new Date((l as any).created_at);
      const t0 = new Date(todayStart);
      const t1 = new Date(tomorrowStart);
      if (createdAt >= t0 && createdAt < t1) row.new_today += 1;
    }

    const agentsOut = Array.from(agentMap.values()).sort((a, b) => {
      // booked priority, then total
      if (b.booked !== a.booked) return b.booked - a.booked;
      return b.total_leads - a.total_leads;
    });

    return {
      ok: true,
      data: {
        kpis: { total_leads, today_new, followups_due, booked },
        pipeline,
        agents: agentsOut,
      },
    };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
