"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

/* ================= TYPES ================= */

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Follow-Up"
  | "Booked"
  | "Lost";

export type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  created_at: string;
};

export type Agent = {
  id: string;
  name: string | null;
  email: string | null;
};

/* ================= HELPERS ================= */

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; error: string };

/* ================= ACTIONS ================= */

/** Get agents (used by Board + AddLeadForm) */
export async function listAgentsAction(): Promise<Ok<Agent[]> | Fail> {
  const { data, error } = await supabaseServer
    .from("agents")
    .select("id,name,email")
    .order("created_at", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

/** Alias (some components expect this name) */
export async function getAgentsAction() {
  return listAgentsAction();
}

/** Create lead (Add Lead form) */
export async function createLeadAction(input: {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status?: LeadStatus;
  assigned_to?: string | null;
}): Promise<Ok<{ id: string }> | Fail> {
  const { data, error } = await supabaseServer
    .from("leads")
    .insert({
      name: input.name ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null,
      status: input.status ?? "New",
      assigned_to: input.assigned_to ?? null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return { ok: true, data: { id: data.id } };
}

/** Move lead between columns (KANBAN DRAG) */
export async function moveLeadAction(input: {
  leadId: string;
  status: LeadStatus;
}): Promise<Ok<true> | Fail> {
  const { error } = await supabaseServer
    .from("leads")
    .update({ status: input.status })
    .eq("id", input.leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/leads");
  return { ok: true, data: true };
}

/** Assign lead to agent */
export async function assignLeadAction(input: {
  leadId: string;
  agentId: string | null;
}): Promise<Ok<true> | Fail> {
  const { error } = await supabaseServer
    .from("leads")
    .update({ assigned_to: input.agentId })
    .eq("id", input.leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/leads");
  return { ok: true, data: true };
}
