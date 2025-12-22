import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import Board from "./components/Board";

export const dynamic = "force-dynamic";

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

export default async function LeadsPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) redirect("/login");

  const { data: statuses, error: sErr } = await supabase
    .from("lead_statuses")
    .select("*")
    .order("position", { ascending: true });

  if (sErr) {
    return (
      <div className="p-6">
        <div className="font-semibold text-red-600">Statuses load error</div>
        <pre className="mt-2 text-sm">{JSON.stringify(sErr, null, 2)}</pre>
      </div>
    );
  }

  const { data: leads, error: lErr } = await supabase
    .from("leads")
    .select("*")
    .order("status_id", { ascending: true })
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (lErr) {
    return (
      <div className="p-6">
        <div className="font-semibold text-red-600">Leads load error</div>
        <pre className="mt-2 text-sm">{JSON.stringify(lErr, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Leads Board</h1>
            <p className="text-sm text-zinc-500">Drag & drop to move leads across stages.</p>
          </div>

          <a
            href="/dashboard"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Back to Dashboard
          </a>
        </div>

        <div className="mt-5">
          <Board
            statuses={(statuses ?? []) as Status[]}
            initialLeads={(leads ?? []) as Lead[]}
          />
        </div>
      </div>
    </div>
  );
}
