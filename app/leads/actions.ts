"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

export type Agent = {
  id: string;
  name: string;
  email?: string | null;
};

export type Lead = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  route?: string | null;
  status: LeadStatus;
  temperature?: string | null; // warm/hot/cold (optional)
  assigned_to?: string | null; // agent id
  created_at?: string | null;
};

export type CreateLeadInput = {
  full_name: string;
  phone?: string; // undefined if empty
  email?: string; // undefined if empty
  source?: string; // default "web"
  route?: string; // undefined if empty
  temperature?: string; // optional
  assigned_to?: string; // optional (agent id)
};

export async function listAgentsAction(): Promise<Agent[]> {
  const supabase = supabaseServer();

  // NOTE: agar tumhare DB me table ka naam different hai (agents/profiles/users),
  // yahan sirf table name change karna hoga.
  const { data, error } = await supabase
    .from("agents")
    .select("id,name,email")
    .order("name", { ascending: true });

  if (error) {
    console.error("listAgentsAction error:", error.message);
    return [];
  }

  return (data ?? []).map((a: any) => ({
    id: String(a.id),
    name: String(a.name ?? ""),
    email: a.email ?? null,
  }));
}

export async function createLeadAction(input: CreateLeadInput): Promise<
  | { ok: true; lead: Lead }
  | { ok: false; error: string }
> {
  const supabase = supabaseServer();

  const payload = {
    full_name: input.full_name.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    source: (input.source?.trim() || "web") as string,
    route: input.route?.trim() || null,
    status: "New" as LeadStatus,
    temperature: input.temperature?.trim() || "warm",
    assigned_to: input.assigned_to?.trim() || null,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("createLeadAction error:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, lead: data as Lead };
}

export async function moveLeadAction(args: {
  leadId: string;
  toStatus: LeadStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = supabaseServer();

  const { error } = await supabase
    .from("leads")
    .update({ status: args.toStatus })
    .eq("id", args.leadId);

  if (error) {
    console.error("moveLeadAction error:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function assignLeadAction(args: {
  leadId: string;
  agentId: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = supabaseServer();

  const { error } = await supabase
    .from("leads")
    .update({ assigned_to: args.agentId })
    .eq("id", args.leadId);

  if (error) {
    console.error("assignLeadAction error:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
