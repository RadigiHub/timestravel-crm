export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function normLabel(s: string) {
  return (s ?? "").trim().toLowerCase();
}

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  // 1) statuses
  const { data: statuses, error: statusErr } = await supabase
    .from("lead_statuses")
    .select("id,label,position")
    .order("position", { ascending: true });

  if (statusErr) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-4 text-red-600 text-sm">Status load error: {statusErr.message}</p>
      </div>
    );
  }

  // 2) leads (minimal fields for KPI calc)
  const { data: leads, error: leadsErr } = await supabase
    .from("leads")
    .select("id,status_id,assigned_to,created_at");

  if (leadsErr) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-4 text-red-600 text-sm">Leads load error: {leadsErr.message}</p>
      </div>
    );
  }

  const statusIdToLabel: Record<string, string> = {};
  for (const s of statuses ?? []) statusIdToLabel[s.id] = s.label;

  const countsByLabel: Record<string, number> = {};
  let total = 0;
  let unassigned = 0;
  let todayNew = 0;

  const todayStart = startOfTodayUTC().getTime();

  for (const l of leads ?? []) {
    total += 1;

    if (!l.assigned_to) unassigned += 1;

    const created = l.created_at ? new Date(l.created_at).getTime() : 0;
    if (created >= todayStart) todayNew += 1;

    const lbl = normLabel(statusIdToLabel[l.status_id] ?? "unknown");
    countsByLabel[lbl] = (countsByLabel[lbl] ?? 0) + 1;
  }

  // match your exact board names
  const kNew = countsByLabel["new"] ?? 0;
  const kContacted = countsByLabel["contacted"] ?? 0;
  const kFollowUp = countsByLabel["follow-up"] ?? countsByLabel["follow up"] ?? 0;
  const kBooked = countsByLabel["booked"] ?? 0;
  const kLost = countsByLabel["lost"] ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Times Travel CRM — quick access & daily overview
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
            <span className="text-zinc-500">Logged in as</span>
            <span className="font-semibold text-zinc-900">{auth.user.email}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/leads"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Open Leads Board
          </Link>

          <form action="/auth/signout" method="post">
            <button className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="text-xs font-semibold text-zinc-500">TOTAL LEADS</div>
          <div className="mt-2 text-3xl font-black text-zinc-900">{total}</div>
          <div className="mt-2 text-sm text-zinc-600">All leads in pipeline</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="text-xs font-semibold text-zinc-500">UNASSIGNED</div>
          <div className="mt-2 text-3xl font-black text-zinc-900">{unassigned}</div>
          <div className="mt-2 text-sm text-zinc-600">Need assignment to agents</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="text-xs font-semibold text-zinc-500">TODAY NEW</div>
          <div className="mt-2 text-3xl font-black text-zinc-900">{todayNew}</div>
          <div className="mt-2 text-sm text-zinc-600">Created since today (UTC)</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold text-zinc-500">New</div>
          <div className="mt-2 text-2xl font-extrabold">{kNew}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold text-zinc-500">Contacted</div>
          <div className="mt-2 text-2xl font-extrabold">{kContacted}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold text-zinc-500">Follow-Up</div>
          <div className="mt-2 text-2xl font-extrabold">{kFollowUp}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold text-zinc-500">Booked</div>
          <div className="mt-2 text-2xl font-extrabold">{kBooked}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold text-zinc-500">Lost</div>
          <div className="mt-2 text-2xl font-extrabold">{kLost}</div>
        </div>
      </div>

      {/* Quick actions / notes */}
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="text-sm font-bold text-zinc-900">Today’s Workflow</div>
        <div className="mt-1 text-sm text-zinc-600">
          Check <b>New</b> → <b>Contacted</b> → <b>Follow-Up</b> → <b>Booked</b> flow.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/leads"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
          >
            View Leads
          </Link>
        </div>
      </div>
    </div>
  );
}
