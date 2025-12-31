"use server";

import { supabaseServer } from "@/lib/supabase/server";

/* ================= TYPES ================= */

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

/* ================= HELPERS ================= */

function normalizeStatus(v: any): LeadStatus {
  const s = String(v || "New").toLowerCase();
  if (s === "contacted") return "Contacted";
  if (s === "follow-up" || s === "followup") return "Follow-Up";
  if (s === "booked") return "Booked";
  if (s === "lost") return "Lost";
  return "New";
}

/* ================= ACTIONS ================= */

export async function listAgentsAction(): Promise<Agent[]> {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("agents")
    .select("id,name")
    .order("name");

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
}) {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: payload.name ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      notes: payload.notes ?? null,
      status: payload.status ?? "New",
      assigned_to: payload.assigned_to ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    ok: true,
    lead: {
      id: String(data.id),
      name: data.name,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
      status: normalizeStatus(data.status),
      assigned_to: data.assigned_to,
      created_at: data.created_at,
    } as Lead,
  };
}

export async function moveLeadAction(args: {
  leadId: string;
  toStatus: LeadStatus;
}) {
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
}) {
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("leads")
    .update({ assigned_to: args.agentId })
    .eq("id", args.leadId);

  if (error) throw new Error(error.message);

  return { ok: true };
}
