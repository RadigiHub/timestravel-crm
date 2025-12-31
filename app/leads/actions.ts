"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { listAgentsAction } from "@/app/leads/actions";

type StatusName = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function normalizeStatusName(name: string): StatusName | null {
  const n = (name || "").trim().toLowerCase();
  if (n === "new") return "New";
  if (n === "contacted") return "Contacted";
  if (n === "follow-up" || n === "follow up" || n === "followup") return "Follow-Up";
  if (n === "booked") return "Booked";
  if (n === "lost") return "Lost";
  return null;
}

export async function getDashboardDataAction() {
  try {
    // IMPORTANT: your supabase helper returns a Promise, so await it
    const supabase = await supabaseServer();

    // 1) statuses
    const { data: statuses, error: stErr } = await supabase
      .from("lead_statuses")
      .select("id,name");

    if (stErr) throw stErr;

    // Map status_id -> normalized name
    const statusIdToName: Record<string, StatusName> = {};
    for (const s of statuses ?? []) {
      const normalized = normalizeStatusName((s as any).name);
      if (normalized) statusIdToName[(s as any).id] = normalized;
    }

    // 2) leads (minimal fields)
    const { data: leads, error: lErr } = await supabase
      .from("leads")
      .select("id,status_id,assigned_to,created_at,follow_up_date");

    if (lErr) throw lErr;

    const all = leads ?? [];

    // 3) compute KPIs
    const todayISO = startOfTodayISO();
    const todayDateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const statusCounts: Record<StatusName, number> = {
      "New": 0,
      "Contacted": 0,
      "Follow-Up": 0,
      "Booked": 0,
      "Lost": 0,
    };

    let totalLeads = 0;
    let todayNew = 0;
    let followupsDue = 0;

    // Agent stats
    const agentStats: Record<string, { total: number; booked: number; newToday: number }> = {};

    for (const l of all) {
      totalLeads += 1;

      const sid = (l as any).status_id as string | null;
      const statusName = sid ? statusIdToName[sid] : null;
      if (statusName) statusCounts[statusName] += 1;

      const createdAt = (l as any).created_at as string | null;
      if (createdAt && createdAt >= todayISO) todayNew += 1;

      const follow = (l as any).follow_up_date as string | null; // usually YYYY-MM-DD
      // Follow-up due: follow_up_date <= today AND not booked/lost
      if (follow && follow <= todayDateStr && statusName !== "Booked" && statusName !== "Lost") {
        followupsDue += 1;
      }

      const agentId = (l as any).assigned_to as string | null;
      if (agentId) {
        if (!agentStats[agentId]) agentStats[agentId] = { total: 0, booked: 0, newToday: 0 };
        agentStats[agentId].total += 1;
        if (statusName === "Booked") agentStats[agentId].booked += 1;
        if (createdAt && createdAt >= todayISO) agentStats[agentId].newToday += 1;
      }
    }

    // 4) fetch agents list (reuse your existing action)
    const agentsRes: any = await listAgentsAction();
    let agents: any[] = [];
    if (Array.isArray(agentsRes)) agents = agentsRes;
    else if (agentsRes?.ok && Array.isArray(agentsRes.agents)) agents = agentsRes.agents;

    const agentsById: Record<string, { id: string; name?: string | null; email?: string | null; full_name?: string | null }> = {};
    for (const a of agents) {
      const id = (a as any).id;
      if (!id) continue;
      agentsById[id] = {
        id,
        name: (a as any).name ?? null,
        full_name: (a as any).full_name ?? null,
        email: (a as any).email ?? null,
      };
    }

    // Build leaderboard
    const leaderboard = Object.entries(agentStats)
      .map(([agentId, st]) => {
        const a = agentsById[agentId];
        const label =
          (a?.full_name || a?.name || a?.email || agentId?.slice(0, 8) + "…") ?? agentId;
        return {
          agentId,
          label,
          total: st.total,
          booked: st.booked,
          newToday: st.newToday,
        };
      })
      .sort((x, y) => (y.booked - x.booked) || (y.total - x.total));

    return {
      ok: true as const,
      data: {
        totalLeads,
        todayNew,
        followupsDue,
        statusCounts,
        leaderboard,
      },
    };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || "Dashboard fetch failed" };
  }
}
