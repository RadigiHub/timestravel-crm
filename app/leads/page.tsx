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

  // Statuses
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

  // Leads
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

  // ✅ Agents (profiles) — IMPORTANT: keep full_name (and email optional)
  const { data: agentsData, error: agentsErr } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("role", "agent")
    .order("full_name", { ascending: true });

  const agents = (agentsErr || !agentsData ? [] : agentsData).map((a: any) => ({
    id: a.id as string,
    full_name: (a.full_name ?? null) as string | null,
    email: (a.email ?? null) as string | null,
    role: (a.role ?? null) as string | null,
  }));

  // Brands
  const { data: brandsData, error: brandsErr } = await supabase
    .from("brands")
    .select("id, name")
    .order("name", { ascending: true });

  const brands = brandsErr || !brandsData ? [] : (brandsData as any);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Leads Board</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Pipeline view + quick status & agent assignment.
          </p>

          {agentsErr ? (
            <p className="mt-2 text-xs text-red-600">
              Agents load failed: {agentsErr.message}
            </p>
          ) : null}
        </div>

        <Link
          href="/dashboard"
          className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Back to Dashboard
        </Link>
      </div>

      <Board
        initialLeads={(leads ?? []) as any}
        agents={agents as any}
        brands={brands as any}
      />
    </div>
  );
}
