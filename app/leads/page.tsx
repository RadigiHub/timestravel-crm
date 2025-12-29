export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import Link from "next/link";
import Board from "./components/Board";
import { supabaseServer } from "@/lib/supabase/server";

export default async function LeadsPage() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) redirect("/login");

  // 1) Statuses (New, Contacted, Follow-Up, Booked, Lost)
  const { data: statuses, error: statusErr } = await supabase
    .from("lead_statuses")
    .select("id,label,position,color")
    .order("position", { ascending: true });

  if (statusErr) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="text-lg font-semibold text-zinc-900">Leads Board</div>
          <div className="mt-2 text-sm text-red-600">
            Failed to load statuses: {statusErr.message}
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2) Leads
  const { data: leads, error: leadsErr } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (leadsErr) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="text-lg font-semibold text-zinc-900">Leads Board</div>
          <div className="mt-2 text-sm text-red-600">
            Failed to load leads: {leadsErr.message}
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Top Bar */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Leads Board</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Drag & drop to move leads across stages.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Kanban Board */}
      <Board statuses={(statuses ?? []) as any} initialLeads={(leads ?? []) as any} />
    </div>
  );
}
