"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

export type Lead = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  status: LeadStatus;
  assigned_to?: string | null;
  created_at?: string;
};

export type Agent = {
  id: string;
  name: string;
};

function normalizeStatus(input: any): LeadStatus {
  const s = String(input || "New").toLowerCase();
  if (s === "contacted") return "Contacted";
  if (s === "follow-up" || s === "followup" || s === "follow_up") return "Follow-Up";
  if (s === "booked") return "Booked";
  if (s === "lost") return "Lost";
  return "New";
}

/**
 * NOTE: table names assumed:
 * - leads
 * - agents
 * Agar tumhare Supabase me names different hain, yahan update kar lena.
 */

export async function listAgentsAction(): Promise<Agent[]> {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("agents")
    .select("id,name")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((a: any) => ({
    id: String(a.id),
    name: String(a.name ?? "Agent"),
  }));
}

export async function createLeadAction(payload: {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status?: LeadStatus;
  assigned_to?: string | null;
}): Promise<{ ok: true; lead: Lead }> {
  const supabase = await supabaseServer();

  const insertRow: any = {
    name: payload.name ?? null,
    phone: payload.phone ?? null,
    email: payload.email ?? null,
    notes: payload.notes ?? null,
    status: payload.status ?? "New",
    assigned_to: payload.assigned_to ?? null,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const lead: Lead = {
    id: String(data.id),
    name: data.name,
    phone: data.phone,
    email: data.email,
    notes: data.notes,
    status: normalizeStatus(data.status),
    assigned_to: data.assigned_to ?? null,
    created_at: data.created_at,
  };

  return { ok: true, lead };
}

export async function moveLeadAction(args: {
  leadId: string;
  toStatus: LeadStatus;
}): Promise<{ ok: true }> {
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("leads")
    .update({ status: args.toStatus })
    .eq("id", args.leadId);

  if (error) throw new Error(error.message);

  return { ok: true };
}

export async function assignLeadAction(args: {
  leadId: string;
  agentId: string | null;
}): Promise<{ ok: true }> {
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("leads")
    .update({ assigned_to: args.agentId })
    .eq("id", args.leadId);

  if (error) throw new Error(error.message);

  return { ok: true };
}
