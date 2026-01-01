// app/dashboard/actions.ts
"use server";

import { supabaseServer } from "@/lib/supabase/server";

type StatusName = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

export type DashboardData = {
  totalLeads: number;
  todayNew: number;
  followupsDue: number;
  statusCounts: Record<StatusName, number>;
  leaderboard: Array<{
    agentId: string | null;
    label: string;
    total: number;
    booked: number;
    newToday: number;
  }>;
};

export async function getDashboardDataAction(): Promise<
  { ok: true; data: DashboardData } | { ok: false; error: string }
> {
  try {
    // ✅ IMPORTANT: await it (this fixes your error)
    const supabase = await supabaseServer();

    // --- Leads snapshot (small/medium CRM ke liye safe)
    const { data: leads, error: leadsErr } = await supabase
      .from("leads")
      .select("id,status,created_at,follow_up_at,agent_id");

    if (leadsErr) return { ok: false, error: leadsErr.message };

    const rows = (leads ?? []) as Array<{
      id: string;
      status: StatusName | string | null;
      created_at: string | null;
      follow_up_at: string | null;
      agent_id: string | null;
    }>;

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const statusCounts: Record<StatusName, number> = {
      New: 0,
      Contacted: 0,
      "Follow-Up": 0,
      Booked: 0,
      Lost: 0,
    };

    let todayNew = 0;
    let followupsDue = 0;

    // Leaderboard bucket
    const byAgent = new Map<
      string | null,
      { total: number; booked: number; newToday: number }
    >();

    const bumpAgent = (agentId: string | null) => {
      if (!byAgent.has(agentId)) byAgent.set(agentId, { total: 0, booked: 0, newToday: 0 });
      return byAgent.get(agentId)!;
    };

    for (const l of rows) {
      const st = (l.status ?? "New") as StatusName;

      if (st in statusCounts) statusCounts[st as StatusName] += 1;

      const createdAt = l.created_at ? new Date(l.created_at) : null;
      if (createdAt && createdAt >= startOfToday) todayNew += 1;

      const followAt = l.follow_up_at ? new Date(l.follow_up_at) : null;
      if (followAt && followAt <= now && st !== "Booked" && st !== "Lost") {
        // due or overdue followups (ignore closed)
        followupsDue += 1;
      }

      // leaderboard (per agent)
      const a = bumpAgent(l.agent_id ?? null);
      a.total += 1;
      if (st === "Booked") a.booked += 1;
      if (createdAt && createdAt >= startOfToday) a.newToday += 1;
    }

    const leaderboard = Array.from(byAgent.entries()).map(([agentId, v]) => ({
      agentId,
      label: agentId ? `Agent ${String(agentId).slice(0, 6)}` : "Unassigned",
      total: v.total,
      booked: v.booked,
      newToday: v.newToday,
    }));

    // Sort: booked desc, then total desc
    leaderboard.sort((a, b) => (b.booked - a.booked) || (b.total - a.total));

    const data: DashboardData = {
      totalLeads: rows.length,
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
