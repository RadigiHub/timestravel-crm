import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import Board from "./components/Board";

export const dynamic = "force-dynamic";

/* ================= TYPES ================= */

type Status = {
  id: string;
  label: string;
  position: number;
  color?: string | null;
};

type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status_id: string;
  position: number;
  priority: "hot" | "warm" | "cold";
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

/* ================= PAGE ================= */

export default async function LeadsPage() {
  const supabase = await supabaseServer();

  /* ---- Auth check ---- */
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  /* ---- Load statuses ---- */
  const { data: statuses, error: statusError } = await supabase
    .from("lead_statuses")
    .select("*")
    .order("position", { ascending: true });

  if (statusError) {
    return (
      <div className="p-6">
        <div className="font-semibold text-red-600">
          Failed to load lead statuses
        </div>
        <pre className="mt-2 text-sm">{JSON.stringify(statusError, null, 2)}</pre>
      </div>
    );
  }

  /* ---- Load leads ---- */
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("*")
    .order("status_id", { ascending: true })
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (leadsError) {
    return (
      <div className="p-6">
        <div className="font-semibold text-red-600">
          Failed to load leads
        </div>
        <pre className="mt-2 text-sm">{JSON.stringify(leadsError, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Leads Board
            </h1>
            <p className="text-sm text-zinc-500">
              Drag & drop to move leads across stages.
            </p>
          </div>

          <a
            href="/dashboard"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Back to Dashboard
          </a>
        </div>

        {/* Board */}
        <div className="mt-5">
          <Board
            key={(leads ?? []).length}
            statuses={(statuses ?? []) as Status[]}
            initialLeads={(leads ?? []) as Lead[]}
          />
        </div>
      </div>
    </div>
  );
}
