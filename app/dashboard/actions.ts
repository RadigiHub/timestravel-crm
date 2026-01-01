"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type StatusName = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

export type DashboardData = {
  totalLeads: number;
  todayNew: number;
  followupsDue: number;
  statusCounts: Record<StatusName, number>;
  leaderboard: Array<{
    agentId: string;
    label: string;
    total: number;
    booked: number;
    newToday: number;
  }>;
};

export type DashboardResult =
  | { ok: true; data: DashboardData }
  | { ok: false; error: string };

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getDashboardDataAction(): Promise<DashboardResult> {
  try {
    const supabase = supabaseServer();

    // --- Leads snapshot (small/medium CRM ke liye safe)
    const { data: leads, error: leadsErr } = await supabase
      .from("leads")
      .select("id,status,created_at,follow_up_at,agent_id");

    if (leadsErr) return { ok: false, error: leadsErr.message };

    // --- Agents
    const { data: agents, error: agentsErr } = await supabase
      .from("agents")
      .select("id,name")
      .order("name", { ascending: true });

    if (agentsErr) return { ok: false, error: agentsErr.message };

    const todayISO = startOfTodayISO();
    const now = new Date();

    const statusCounts: Record<StatusName, number> = {
      "New": 0,
      "Contacted": 0,
      "Follow-Up": 0,
      "Booked": 0,
      "Lost": 0,
    };

    let todayNew = 0;
    let followupsDue = 0;

    for (const l of leads ?? []) {
      const s = (l.status ?? "New") as StatusName;
      if (statusCounts[s] === undefined) {
        // unknown status => ignore count bucket (or map to New)
      } else {
        statusCounts[s] += 1;
      }

      if (l.created_at && new Date(l.created_at).toISOString() >= todayISO) {
        todayNew += 1;
      }

      // follow_up_at due today / overdue, and not already closed
      if (l.follow_up_at) {
        const fu = new Date(l.follow_up_at);
        if (fu <= now && s !== "Booked" && s !== "Lost") {
          followupsDue += 1;
        }
      }
    }

    const leadsByAgent = new Map<
      string,
      { total: number; booked: number; newToday: number }
    >();

    for (const l of leads ?? []) {
      const agentId = l.agent_id;
      if (!agentId) continue;

      const s = (l.status ?? "New") as StatusName;
      const row =
        leadsByAgent.get(agentId) ?? { total: 0, booked: 0, newToday: 0 };

      row.total += 1;
      if (s === "Booked") row.booked += 1;

      if (l.created_at && new Date(l.created_at).toISOString() >= todayISO) {
        row.newToday += 1;
      }

      leadsByAgent.set(agentId, row);
    }

    const leaderboard = (agents ?? []).map((a: any) => {
      const stats = leadsByAgent.get(a.id) ?? { total: 0, booked: 0, newToday: 0 };
      return {
        agentId: a.id,
        label: a.name ?? "Agent",
        total: stats.total,
        booked: stats.booked,
        newToday: stats.newToday,
      };
    });

    // Sort: booked desc, then total desc
    leaderboard.sort((x, y) => {
      if (y.booked !== x.booked) return y.booked - x.booked;
      return y.total - x.total;
    });

    const data: DashboardData = {
      totalLeads: (leads ?? []).length,
      todayNew,
      followupsDue,
      statusCounts,
      leaderboard,
    };

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
