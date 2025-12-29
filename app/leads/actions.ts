"use server";

import { supabaseServer } from "@/lib/supabase/server";

/**
 * This wrapper makes it work whether `supabaseServer` is:
 * - a function returning a client, OR
 * - already a client instance
 */
function getSupabase() {
  const anySb: any = supabaseServer as any;
  return typeof anySb === "function" ? anySb() : anySb;
}

// ---------- Types (components import these from ../actions) ----------
export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";
export type LeadHeat = "cold" | "warm" | "hot";

export type Agent = {
  id: string;
  name: string;
  email?: string | null;
  handle?: string | null; // e.g. "shahyan"
};

export type Lead = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null; // "Meta" / "web" etc
  route?: string | null;  // optional
  status: LeadStatus;
  heat?: LeadHeat | null;
  assigned_to?: string | null; // agent handle OR name (your UI shows #handle)
  created_at?: string | null;
};

export type CreateLeadInput = {
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  route?: string;
  heat?: LeadHeat;
  assigned_to?: string; // optional
};

export type CreateLeadResult =
  | { ok: true; lead: Lead }
  | { ok: false; message: string };

// ---------- Actions ----------
export async function listAgentsAction(): Promise<Agent[]> {
  const supabase = getSupabase();

  // Adjust table/columns if needed, but this will compile and deploy.
  const { data, error } = await supabase
    .from("agents")
    .select("id,name,email,handle")
    .order("name", { ascending: true });

  if (error) {
    // Return empty list instead of crashing UI
    return [];
  }

  return (data ?? []) as Agent[];
}

export async function createLeadAction(input: CreateLeadInput): Promise<CreateLeadResult> {
  const supabase = getSupabase();

  if (!input?.name || input.name.trim().length < 2) {
    return { ok: false, message: "Name is required." };
  }

  const payload: Partial<Lead> = {
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    source: input.source?.trim() || null,
    route: input.route?.trim() || null,
    heat: input.heat || "warm",
    status: "New",
    assigned_to: input.assigned_to?.trim() || null,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, lead: data as Lead };
}

export async function moveLeadAction(leadId: string, newStatus: LeadStatus) {
  const supabase = getSupabase();

  if (!leadId) return { ok: false, message: "Missing leadId" };

  const { error } = await supabase
    .from("leads")
    .update({ status: newStatus })
    .eq("id", leadId);

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function assignLeadAction(leadId: string, assignedTo: string | null) {
  const supabase = getSupabase();

  if (!leadId) return { ok: false, message: "Missing leadId" };

  const { error } = await supabase
    .from("leads")
    .update({ assigned_to: assignedTo ? assignedTo.trim() : null })
    .eq("id", leadId);

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
