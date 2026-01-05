export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import LeadDetailsClient from "./ui/LeadDetailsClient";
import { supabaseServer } from "@/lib/supabase/server";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default async function LeadDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  const leadId = params?.id;

  if (!leadId || !isUuid(leadId)) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="text-lg font-semibold text-zinc-900">Lead not found</div>
          <div className="mt-2 text-sm text-zinc-600">Invalid lead id.</div>
          <div className="mt-4">
            <Link
              href="/leads"
              className="inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Back to Leads Board
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadErr || !lead) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="text-lg font-semibold text-zinc-900">Lead not found</div>
          <div className="mt-2 text-sm text-zinc-600">
            {leadErr?.message ?? "This lead does not exist."}
          </div>
          <div className="mt-4">
            <Link
              href="/leads"
              className="inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Back to Leads Board
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("role", "agent")
    .order("full_name", { ascending: true });

  const agents = (profiles ?? []).map((p: any) => ({
    id: p.id as string,
    full_name: (p.full_name ?? null) as string | null,
    email: (p.email ?? null) as string | null,
    role: (p.role ?? null) as string | null,
  }));

  const { data: activities } = await supabase
    .from("lead_activities")
    .select("id, lead_id, type, message, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Lead Details</h1>
          <p className="mt-1 text-sm text-zinc-600">One lead view + actions + timeline.</p>
        </div>

        <Link
          href="/leads"
          className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Back to Leads Board
        </Link>
      </div>

      <LeadDetailsClient
        lead={lead as any}
        agents={agents as any}
        activities={(activities ?? []) as any}
      />
    </div>
  );
}
