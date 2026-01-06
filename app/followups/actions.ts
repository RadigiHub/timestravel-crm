"use server";

import { supabaseServer } from "@/lib/supabase/server";
import type { LeadStatus } from "../leads/actions";

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; error: string };

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Unknown error";
}

export type FollowupLeadRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  notes: string | null;

  status: LeadStatus;
  follow_up_at: string | null;
  created_at: string;

  agent_id: string | null;
  agent_name: string | null;
};

function startOfTomorrowISO() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.toISOString();
}

export async function listFollowupsDueAction(): Promise<Ok<FollowupLeadRow[]> | Fail> {
  try {
    const supabase = await supabaseServer();

    const tomorrowStart = startOfTomorrowISO();

    // due today OR overdue: follow_up_at < tomorrow 00:00
    // exclude Booked/Lost because follow-ups irrelevant there
    const { data, error } = await supabase
      .from("leads")
      .select("id,full_name,phone,email,source,notes,status,follow_up_at,created_at,agent_id")
      .not("follow_up_at", "is", null)
      .lt("follow_up_at", tomorrowStart)
      .neq("status", "Booked")
      .neq("status", "Lost")
      .order("follow_up_at", { ascending: true })
      .limit(200);

    if (error) return { ok: false, error: error.message };

    const rows = data ?? [];

    // agent names
    const agentIds = Array.from(new Set(rows.map((r: any) => r.agent_id).filter(Boolean)));
    let agentMap = new Map<string, string>();

    if (agentIds.length) {
      const { data: agents, error: aErr } = await supabase
        .from("profiles")
        .select("id,full_name,email")
        .in("id", agentIds);

      if (!aErr && agents) {
        for (const a of agents as any[]) {
          const name = (a.full_name ?? "").trim();
          const email = (a.email ?? "").trim();
          agentMap.set(a.id, name || (email ? email.split("@")[0] : "") || `Agent ${String(a.id).slice(0, 8)}`);
        }
      }
    }

    const out: FollowupLeadRow[] = rows.map((r: any) => ({
      id: r.id,
      full_name: r.full_name ?? null,
      phone: r.phone ?? null,
      email: r.email ?? null,
      source: r.source ?? null,
      notes: r.notes ?? null,
      status: (r.status ?? "New") as LeadStatus,
      follow_up_at: r.follow_up_at ?? null,
      created_at: r.created_at,
      agent_id: r.agent_id ?? null,
      agent_name: r.agent_id ? agentMap.get(r.agent_id) ?? null : null,
    }));

    return { ok: true, data: out };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function setFollowupAtAction(args: { id: string; follow_up_at: string | null }): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("leads")
      .update({ follow_up_at: args.follow_up_at })
      .eq("id", args.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function updateLeadStatusAction(args: { id: string; status: LeadStatus }): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase.from("leads").update({ status: args.status }).eq("id", args.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
