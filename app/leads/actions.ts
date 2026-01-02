"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

export type Agent = {
  id: string;
  name: string | null;
  email: string | null;
};

export type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: LeadStatus;
  agent_id: string | null;
  created_at: string;
  follow_up_at: string | null;
};

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; error: string };

async function getSB() {
  // Tumhare project me supabaseServer function bhi ho sakta hai OR already client.
  const anySb: any = supabaseServer as any;
  return typeof anySb === "function" ? await anySb() : anySb;
}

function clean(v?: string | null) {
  return (v ?? "").trim();
}

function buildNotes(source?: string | null, notes?: string | null) {
  const s = clean(source);
  const n = clean(notes);
  if (!s && !n) return null;
  if (s && n) return `Source: ${s}\n\n${n}`;
  if (s) return `Source: ${s}`;
  return n;
}

/** ✅ Agents list */
export async function listAgentsAction(): Promise<Ok<Agent[]> | Fail> {
  try {
    const sb = await getSB();
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

/** ✅ Compatibility alias (tumhare UI me getAgentsAction import ho raha hai) */
export const getAgentsAction = listAgentsAction;

/** ✅ Create lead (detailed form supported through notes/source) */
export async function createLeadAction(input: {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  source?: string;
  status?: LeadStatus;
  assigned_to?: string | null; // UI name
  agent_id?: string | null; // optional support if kisi file me agent_id use ho
}): Promise<Ok<Lead> | Fail> {
  try {
    const sb = await getSB();

    const name = clean(input.name);
    const phone = clean(input.phone);
    const email = clean(input.email);
    const status: LeadStatus = (input.status ?? "New") as LeadStatus;

    const agent_id = (input.agent_id ?? input.assigned_to ?? null) as string | null;

    const notes = buildNotes(input.source, input.notes);

    const { data, error } = await sb
      .from("leads")
      .insert([
        {
          name: name || null,
          phone: phone || null,
          email: email || null,
          notes,
          status,
          agent_id,
        },
      ])
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { ok: true, data: data as Lead };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to create lead" };
  }
}

/** ✅ Move lead across statuses (Board drag/drop ya buttons) */
export async function moveLeadAction(input: {
  leadId: string;
  toStatus: LeadStatus;
}): Promise<Ok<{ id: string; status: LeadStatus }> | Fail> {
  try {
    const sb = await getSB();
    const { data, error } = await sb
      .from("leads")
      .update({ status: input.toStatus })
      .eq("id", input.leadId)
      .select("id,status")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { ok: true, data: data as { id: string; status: LeadStatus } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to move lead" };
  }
}

/** ✅ Assign lead to agent */
export async function assignLeadAction(input: {
  leadId: string;
  agentId: string | null;
}): Promise<Ok<{ id: string; agent_id: string | null }> | Fail> {
  try {
    const sb = await getSB();
    const { data, error } = await sb
      .from("leads")
      .update({ agent_id: input.agentId })
      .eq("id", input.leadId)
      .select("id,agent_id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { ok: true, data: data as { id: string; agent_id: string | null } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to assign lead" };
  }
}
