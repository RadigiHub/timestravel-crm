"use server";

import { supabaseServer } from "@/lib/supabase/server";

/** Types */
export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

export type Ok<T> = { ok: true; data: T };
export type Fail = { ok: false; error: string };

export type Agent = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export type Lead = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  status?: LeadStatus | null;
  assigned_to?: string | null;
  created_at?: string | null;
};

/** Helpers */
function clean(v?: string | null) {
  return (v ?? "").trim();
}

function buildNotes(source?: string, notes?: string) {
  const s = clean(source);
  const n = clean(notes);
  if (!s && !n) return null;
  if (s && n) return `Source: ${s}\n\n${n}`;
  if (s) return `Source: ${s}`;
  return n;
}

/** ACTION: list agents (Always returns Ok<Agent[]> with .data) */
export async function listAgentsAction(): Promise<Ok<Agent[]> | Fail> {
  try {
    const sb = await supabaseServer(); // IMPORTANT: function call
    const { data, error } = await sb
      .from("agents")
      .select("id,name,email")
      .order("created_at", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as Agent[] };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to load agents" };
  }
}

/** Backwards compatibility (agar kahin purana import reh gaya ho) */
export async function getAgentsAction() {
  return listAgentsAction();
}

/** ACTION: create lead (detail form mapping) */
export async function createLeadAction(input: {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status?: LeadStatus;
  assigned_to?: string | null;
  source?: string;
}): Promise<Ok<Lead> | Fail> {
  try {
    const sb = await supabaseServer();

    const payload = {
      name: clean(input.name) || null,
      phone: clean(input.phone) || null,
      email: clean(input.email) || null,
      notes: buildNotes(input.source, input.notes),
      status: input.status ?? "New",
      assigned_to: input.assigned_to ?? null,
    };

    const { data, error } = await sb
      .from("leads")
      .insert(payload)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Lead };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to create lead" };
  }
}

/** ACTION: move lead between statuses */
export async function moveLeadAction(input: {
  leadId: string;
  status: LeadStatus;
}): Promise<Ok<Lead> | Fail> {
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb
      .from("leads")
      .update({ status: input.status })
      .eq("id", input.leadId)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Lead };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to move lead" };
  }
}

/** ACTION: assign lead to agent */
export async function assignLeadAction(input: {
  leadId: string;
  agentId: string | null;
}): Promise<Ok<Lead> | Fail> {
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb
      .from("leads")
      .update({ assigned_to: input.agentId })
      .eq("id", input.leadId)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Lead };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to assign lead" };
  }
}
