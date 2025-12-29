// /app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

type LeadRow = {
  id: string;
  status_id: string | null;
  assigned_to: string | null;
  created_at: string | null;
};

type StatusRow = {
  id: string;
  label: string;
  position: number | null;
  color?: string | null;
};

function startOfTodayUTCISO() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  return new Date(Date.UTC(y, m, d, 0, 0, 0, 0)).toISOString();
}

function normalizeLabel(s: string) {
  return (s || "").trim().toLowerCase();
}

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) redirect("/login");

  // Server action: logout (keep working)
  async function signOutAction() {
    "use server";
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
    redirect("/login");
  }

  // Fetch statuses (so counts match your real board)
  const { data: statusesRaw, error: stErr } = await supabase
    .from("lead_statuses")
    .select("id, label, position, color")
    .order("position", { ascending: true });

  // If you don't have lead_statuses table, fallback to the labels you shared.
  const fallbackStatuses: StatusRow[] = [
    { id: "new", label: "New", position: 1 },
    { id: "contacted", label: "Contacted", position: 2 },
    { id: "followup", label: "Follow-Up", position: 3 },
    { id: "booked", label: "Booked", position: 4 },
    { id: "lost", label: "Lost", position: 5 },
  ];

  const statuses: StatusRow[] =
    !stErr && Array.isArray(statusesRaw) && statusesRaw.length
      ? (statusesRaw as any)
      : fallbackStatuses;

  // Fetch leads for KPI counts
  const { data: leadsRaw, error: leadsErr } = await supabase
    .from("leads")
    .select("id, status_id, assigned_to, created_at");

  const leads: LeadRow[] = !leadsErr && Array.isArray(leadsRaw) ? (leadsRaw as any) : [];

  const totalLeads = leads.length;
  const unassignedLeads = leads.filter((l) => !l.assigned_to).length;

  const todayStartUTC = startOfTodayUTCISO();
  const todayNew = leads.filter((l) => {
    if (!l.created_at) return false;
    return l.created_at >= todayStartUTC;
  }).length;

  // Status counts (by status_id -> label)
  const statusIdToLabel: Record<string, string> = {};
  for (const s of statuses) statusIdToLabel[s.id] = s.label;

  const countsByLabel: Record<string, number> = {};
  for (const s of statuses) countsByLabel[normalizeLabel(s.label)] = 0;

  for (const l of leads) {
    const label = l.status_id ? statusIdToLabel[l.status_id] : "";
    const key = normalizeLabel(label);
    if (!key) continue;
    countsByLabel[key] = (countsByLabel[key] ?? 0) + 1;
  }

  // Pick the 5 core labels you showed
  const core = [
    { key: "new", title: "New" },
    { key: "contacted", title: "Contacted" },
    { key: "follow-up", title: "Follow-Up" },
    { key: "booked", title: "Booked" },
    { key: "lost", title: "Lost" },
  ];

  // If your DB labels differ slightly, try matching smartly
  const smartGet = (k: string) => {
    const direct = countsByLabel[k];
    if (typeof direct === "number") return direct;

    // common variations
    const alt =
      k === "follow-up"
        ? countsByLabel["followup"] ?? countsByLabel["follow up"]
        : countsByLabel[k.replace("-", " ")] ?? countsByLabel[k.replace(" ", "-")];

    return typeof alt === "number" ? alt : 0;
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top Bar */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-2xl font-semibold tracking-tight text-zinc-900">Dashboard</div>
              <div className="text-sm text-zinc-500">
                Times Travel CRM — daily overview & quick actions
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/leads"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Open Leads Board
              </Link>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
            <span className="text-zinc-500">Logged in as</span>
            <span className="font-semibold text-zinc-900">{auth.user.email}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Total Leads
            </div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900">{totalLeads}</div>
            <div className="mt-1 text-sm text-zinc-500">All leads in pipeline</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Unassigned
            </div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900">{unassignedLeads}</div>
            <div className="mt-1 text-sm text-zinc-500">Need assignment to agents</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Today New
            </div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900">{todayNew}</div>
            <div className="mt-1 text-sm text-zinc-500">Created since today (UTC)</div>
          </div>
        </div>

        {/* Pipeline Breakdown */}
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-base font-semibold text-zinc-900">Pipeline Overview</div>
              <div className="text-sm text-zinc-500">
                Quick counts by status (New → Contacted → Follow-Up → Booked / Lost)
              </div>
            </div>

            <Link
              href="/leads"
              className="inline-flex w-fit items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              View Leads
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-semibold uppercase text-zinc-500">New</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{smartGet("new")}</div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-semibold uppercase text-zinc-500">Contacted</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{smartGet("contacted")}</div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-semibold uppercase text-zinc-500">Follow-Up</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{smartGet("follow-up")}</div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-semibold uppercase text-zinc-500">Booked</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{smartGet("booked")}</div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-semibold uppercase text-zinc-500">Lost</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{smartGet("lost")}</div>
            </div>
          </div>
        </div>

        {/* Next steps area (clean, not cheesy) */}
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-base font-semibold text-zinc-900">What’s Next</div>
          <div className="mt-2 space-y-2 text-sm text-zinc-600">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-zinc-900" />
              <div>
                <span className="font-medium text-zinc-900">Agent performance</span> — leads per agent,
                response SLA, and conversion to Booked.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-zinc-900" />
              <div>
                <span className="font-medium text-zinc-900">Reminders</span> — follow-up due today and
                overdue leads.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-zinc-900" />
              <div>
                <span className="font-medium text-zinc-900">Duplicate protection</span> — stop double
                leads via phone/email rules.
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/leads"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Go to Leads Board
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Manage Login / Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
