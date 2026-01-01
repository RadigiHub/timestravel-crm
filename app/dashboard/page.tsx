import { getDashboardDataAction } from "./actions";

export const dynamic = "force-dynamic";

function Card({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-zinc-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-zinc-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}

type StatusName = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

type LeaderboardRow = {
  agentId: string;
  label: string;
  total: number;
  booked: number;
  newToday: number;
};

type DashboardData = {
  totalLeads: number;
  todayNew: number;
  followupsDue: number;
  statusCounts: Record<StatusName, number>;
  leaderboard: LeaderboardRow[];
};

export default async function DashboardPage() {
  let data: DashboardData | null = null;
  let errorMsg: string | null = null;

  try {
    data = (await getDashboardDataAction()) as DashboardData;
  } catch (e: any) {
    errorMsg = e?.message || "Unknown error";
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Dashboard load failed: {errorMsg ?? "No data returned"}
        </div>
      </div>
    );
  }

  const { totalLeads, todayNew, followupsDue, statusCounts, leaderboard } = data;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-semibold text-zinc-900">Dashboard</div>
        <div className="text-sm text-zinc-600">
          Live KPIs — aaj ki performance aur pipeline overview.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card title="Total Leads" value={totalLeads} />
        <Card title="Today New" value={todayNew} hint="Created today" />
        <Card title="Follow-ups Due" value={followupsDue} hint="Due today / overdue" />
        <Card title="Booked" value={statusCounts["Booked"]} hint="Total booked" />
      </div>

      {/* Status Overview */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-zinc-900">Pipeline Status</div>
            <div className="text-sm text-zinc-600">
              New → Contacted → Follow-Up → Booked/Lost
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <Card title="New" value={statusCounts["New"]} />
          <Card title="Contacted" value={statusCounts["Contacted"]} />
          <Card title="Follow-Up" value={statusCounts["Follow-Up"]} />
          <Card title="Booked" value={statusCounts["Booked"]} />
          <Card title="Lost" value={statusCounts["Lost"]} />
        </div>
      </div>

      {/* Agent Leaderboard */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-zinc-900">Agent Leaderboard</div>
            <div className="text-sm text-zinc-600">Booked priority, then total workload</div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                <th className="py-2 pr-3">Agent</th>
                <th className="py-2 pr-3">Total Leads</th>
                <th className="py-2 pr-3">Booked</th>
                <th className="py-2 pr-3">New Today</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard?.length ? (
                leaderboard.map((a) => (
                  <tr key={a.agentId} className="border-b border-zinc-100">
                    <td className="py-3 pr-3 font-medium text-zinc-900">{a.label}</td>
                    <td className="py-3 pr-3 text-zinc-700">{a.total}</td>
                    <td className="py-3 pr-3 text-zinc-700">{a.booked}</td>
                    <td className="py-3 pr-3 text-zinc-700">{a.newToday}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 text-zinc-600" colSpan={4}>
                    No assigned leads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          Next: hum yahan per “Conversion %”, “Avg time to Contact”, aur “Follow-up overdue list”
          bhi add kar sakte hain.
        </div>
      </div>
    </div>
  );
}
