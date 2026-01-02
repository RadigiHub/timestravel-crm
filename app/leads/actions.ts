"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

export type Lead = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  notes: string | null;
  status: LeadStatus | null;
  assigned_to: string | null;
  created_at?: string | null;
};

export type Agent = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at?: string | null;
};

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; error: string };

function clean(v?: string | null) {
  return (v ?? "").trim();
}

async function db() {
  // IMPORTANT: supabaseServer is a FUNCTION in your project
  // so we must call it to get the client
  return await supabaseServer();
}

/** Agents list for dropdown */
export async function listAgentsAction(): Promise<Ok<Agent[]> | Fail> {
  try {
    const supabase = await db();
    const { data, error } = await supabase
      .from("agents")
      .select("id,full_name,email,created_at")
      .order("created_at", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as Agent[] };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to load agents" };
  }
}

/** Create lead (detail form) */
export async function createLeadAction(payload: {
  full_name?: string;
  phone?: string;
  email?: string;
  source?: string;
  notes?: string;
  status?: LeadStatus;
  assigned_to?: string | null;
}): Promise<Ok<Lead> | Fail> {
  try {
    const supabase = await db();

    const insertRow = {
      full_name: clean(payload.full_name) || null,
      phone: clean(payload.phone) || null,
      email: clean(payload.email) || null,
      source: clean(payload.source) || "web",
      notes: clean(payload.notes) || null,
      status: payload.status ?? "New",
      assigned_to: payload.assigned_to ?? null,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(insertRow)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Lead };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to create lead" };
  }
}

/** Move lead status on board */
export async function moveLeadAction(args: {
  leadId: string;
  status: LeadStatus;
}): Promise<Ok<true> | Fail> {
  try {
    const supabase = await db();
    const { error } = await supabase
      .from("leads")
      .update({ status: args.status })
      .eq("id", args.leadId);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to move lead" };
  }
}

/** Assign lead to agent */
export async function assignLeadAction(args: {
  leadId: string;
  agentId: string | null;
}): Promise<Ok<true> | Fail> {
  try {
    const supabase = await db();
    const { error } = await supabase
      .from("leads")
      .update({ assigned_to: args.agentId })
      .eq("id", args.leadId);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to assign lead" };
  }
}
