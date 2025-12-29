export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

type LeadStatusRow = {
  id: string;
  label: string;
  position: number;
  color?: string | null;
};

type LeadRow = {
  id: string;
  status_id: string;
  assigned_to: string | null;
  created_at: string;
  last_activity_at?: string | null;
  full_name?: string | null;
  phone?: string | null;
  source?: string | null;
  priority?: "hot" | "warm" | "cold" | null;
};

type AgentRow = {
  id: string;
  full_name: string | null;
  role: string | null;
};

function getUtcStartOfTodayISO() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function safeName(s?: string | null) {
  const t = (s ?? "").trim();
  return t || "—";
}

function pct(n: number, d: number) {
  if (!d) return "0%";
  return `${Math.round((n / d) * 100)}%`;
}

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  async function signOutAction() {
    "use server";
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
    redirect("/login");
  }

  // Load statuses (for ordered KPI breakdown)
  const { data: statusesRaw } = await supabase
    .from("lead_statuses")
    .select("id,label,position,color")
    .order("position", { ascending: true });

  const statuses: LeadStatusRow[] = (statusesRaw ?? []) as any;

  // Load leads (only fields needed for dashboard KPIs)
  const { data: leadsRaw } = await supabase
    .from("leads")
    .select("id,status_id,assigned_to,created_at,last_activity_at,full_name,phone,source,priority")
    .order("created_at", { ascending: false });

  const leads: LeadRow[] = (leadsRaw ?? []) as any;

  // Load agents (for leaderboard)
  const { data: agentsRaw } = await supabase
    .from("profiles")
    .select("id,full_name,role")
    .in("role", ["agent", "admin"])
    .order("full_name", { ascending: true });

  const agents: AgentRow[] = (agentsRaw ?? []) as any;

  const todayStart = getUtcStartOfTodayISO();

  const totalLeads = leads.length;
  const unassigned = leads.filter((l) => !l.assigned_to).length;
  const todayNew = leads.filter((l) => (l.created_at ?? "") >= todayStart).length;

  // Build lookup: status_id -> label
  const statusLabelById: Record<string, string> = {};
  for (const s of statuses) statusLabelById[s.id] = s.label;

  // Status counts (ordered)
  const statusCounts: { id: string; label: string; count: number }[] = statuses.map((s) => ({
    id: s.id,
    label: s.label,
    count: leads.filter((l) => l.status_id === s.id).length,
  }));

  // Attempt to identify key stages by label
  const labelNorm = (x: string) => x.trim().toLowerCase();
  const bookedStatusIds = statuses.filter((s) => labelNorm(s.label) === "booked").map((s) => s.id);
  const lostStatusIds = statuses.filter((s) => labelNorm(s.label) === "lost").map((s) => s.id);

  const bookedCount = leads.filter((l) => bookedStatusIds.includes(l.status_id)).length;
  const lostCount = leads.filter((l) => lostStatusIds.includes(l.status_id)).length;

  const pipelineActive = totalLeads - lostCount; // rough
  const conversionRate = pct(bookedCount, Math.max(1, totalLeads));

  // Agent stats
  const agentNameById: Record<string, string> = {};
  for (const a of agents) agentNameById[a.id] = safeName(a.full_name);

  const agentStats = agents
    .map((a) => {
      const myLeads = leads.filter((l) => l.assigned_to === a.id);
      const myTotal = myLeads.length;
      const myBooked = myLeads.filter((l) => bookedStatusIds.includes(l.status_id)).length;
      const myLost = myLeads.filter((l) => lostStatusIds.includes(l.status_id)).length;

      return {
        id: a.id,
        name: agentNameById[a.id] ?? "—",
        total: myTotal,
        booked: myBooked,
        lost: myLost,
        winRate: pct(myBooked, Math.max(1, myTotal)),
      };
    })
    .sort((x, y) => y.booked - x.booked || y.total - x.total)
    .slice(0, 6);

  const recentLeads = leads.slice(0, 8);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top Bar */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-2xl font-semibold text-zinc-900">Dashboard</div>
              <div className="text-sm text-zinc-600">
                Times Travel CRM — daily overview & quick actions
              </div>

              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
                <span className="text-zinc-500">Logged in as</span>
                <span className="font-semibold text-zinc-900">{auth.user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/leads"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Open Leads Board
              </Link>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold tracking-wide text-zinc-500">TOTAL LEADS</div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900">{totalLeads}</div>
            <div className="mt-1 text-sm text-zinc-600">All leads in pipeline</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold tracking-wide text-zinc-500">UNASSIGNED</div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900">{unassigned}</div>
            <div className="mt-1 text-sm text-zinc-600">Need assignment to agents</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold tracking-wide text-zinc-500">TODAY NEW</div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900">{todayNew}</div>
            <div className="mt-1 text-sm text-zinc-600">Created since today (UTC)</div>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold text-zinc-900">Pipeline Overview</div>
              <div className="text-sm text-zinc-600">
                Quick counts by status (New → Contacted → Follow-Up → Booked / Lost)
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
                <span className="text-zinc-500">Conversion:</span>{" "}
                <span className="font-semibold text-zinc-900">{conversionRate}</span>
              </div>

              <Link
                href="/leads"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
              >
                View Leads
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {statusCounts.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {s.label}
                </div>
                <div className="mt-1 text-2xl font-semibold text-zinc-900">{s.count}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            Active pipeline (approx): <span className="font-semibold text-zinc-700">{pipelineActive}</span> • Booked:{" "}
            <span className="font-semibold text-zinc-700">{bookedCount}</span> • Lost:{" "}
            <span className="font-semibold text-zinc-700">{lostCount}</span>
          </div>
        </div>

        {/* Agent Performance + Recent Activity */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-zinc-900">Top Agents</div>
                <div className="text-sm text-zinc-600">Booked leads & win rate</div>
              </div>
              <div className="text-xs text-zinc-500">Preview</div>
            </div>

            <div className="mt-4 space-y-2">
              {agentStats.length ? (
                agentStats.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-900">{a.name}</div>
                      <div className="text-xs text-zinc-600">
                        Total: <span className="font-semibold">{a.total}</span> • Lost:{" "}
                        <span className="font-semibold">{a.lost}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-zinc-900">Booked: {a.booked}</div>
                      <div className="text-xs text-zinc-600">Win: {a.winRate}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
                  No agents found yet. Add profiles with role = agent/admin.
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-zinc-500">
              Next upgrade: agent response SLA, overdue follow-ups, and per-agent conversion funnel.
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-zinc-900">Recent Leads</div>
                <div className="text-sm text-zinc-600">Latest created in the system</div>
              </div>
              <Link
                href="/leads"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
              >
                Open Board
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              {recentLeads.length ? (
                recentLeads.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-zinc-900">
                          {safeName(l.full_name)}
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-600">
                          {l.phone ? l.phone : "—"} • {l.source ? `Source: ${l.source}` : "No source"}
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-500">
                          Status:{" "}
                          <span className="font-semibold text-zinc-700">
                            {statusLabelById[l.status_id] ?? "—"}
                          </span>
                          {" • "}
                          Assigned:{" "}
                          <span className="font-semibold text-zinc-700">
                            {l.assigned_to ? agentNameById[l.assigned_to] ?? "Agent" : "Unassigned"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-xs text-zinc-500">
                        <div>{new Date(l.created_at).toLocaleString()}</div>
                        <div className="mt-1 inline-flex rounded-lg border border-zinc-200 bg-white px-2 py-1">
                          {l.priority ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
                  No leads yet. Create a lead from Leads Board.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* What’s next */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-lg font-semibold text-zinc-900">What’s Next (State-of-the-art upgrades)</div>

          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-sm font-semibold text-zinc-900">Agent KPIs</div>
              <div className="mt-1 text-sm text-zinc-600">
                Leads per agent, booked rate, response speed, and follow-up compliance.
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-sm font-semibold text-zinc-900">Reminders</div>
              <div className="mt-1 text-sm text-zinc-600">
                Follow-up due today, overdue list, and auto WhatsApp templates by stage.
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-sm font-semibold text-zinc-900">Duplicate Protection</div>
              <div className="mt-1 text-sm text-zinc-600">
                Block duplicate phone/email leads + merge suggestions.
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/leads"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Go to Leads Board
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
            >
              Manage Login / Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
