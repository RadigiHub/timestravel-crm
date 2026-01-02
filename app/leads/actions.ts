"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

export type Agent = {
  id: string;
  name: string;
  email?: string | null;
};

export type Lead = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  notes?: string | null;
  status: LeadStatus;
  agent_id?: string | null;
  created_at?: string | null;
  follow_up_at?: string | null;
};

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; error: string };

function clean(v?: string | null) {
  return (v ?? "").trim();
}

export async function listAgentsAction(): Promise<Ok<Agent[]> | Fail> {
  try {
    const supabase = await supabaseServer(); // ✅ IMPORTANT

    const { data, error } = await supabase
      .from("agents")
      .select("id,name,email")
      .order("created_at", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as Agent[] };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "listAgentsAction failed" };
  }
}

export async function createLeadAction(input: {
  full_name: string;
  phone?: string;
  email?: string;
  source?: string;
  notes?: string;
  status?: LeadStatus;
  assigned_to?: string | null; // (agent id)
  follow_up_at?: string | null;
}): Promise<Ok<{ id: string }> | Fail> {
  try {
    const supabase = await supabaseServer(); // ✅ IMPORTANT

    const payload = {
      full_name: clean(input.full_name),
      phone: clean(input.phone) || null,
      email: clean(input.email) || null,
      source: clean(input.source) || null,
      notes: clean(input.notes) || null,
      status: (input.status ?? "New") as LeadStatus,
      agent_id: input.assigned_to ?? null,
      follow_up_at: input.follow_up_at ?? null,
    };

    if (!payload.full_name) {
      return { ok: false, error: "Full name is required." };
    }

    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: data.id as string } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "createLeadAction failed" };
  }
}

export async function moveLeadAction(input: {
  leadId: string;
  status: LeadStatus;
}): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer(); // ✅ IMPORTANT

    const { error } = await supabase
      .from("leads")
      .update({ status: input.status })
      .eq("id", input.leadId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { ok: true, data: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "moveLeadAction failed" };
  }
}

export async function assignLeadAction(input: {
  leadId: string;
  agentId: string | null;
}): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer(); // ✅ IMPORTANT

    const { error } = await supabase
      .from("leads")
      .update({ agent_id: input.agentId })
      .eq("id", input.leadId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { ok: true, data: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "assignLeadAction failed" };
  }
}
