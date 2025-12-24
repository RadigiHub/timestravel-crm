"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type CreateLeadInput = {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  status_id?: string | null;
  priority?: "hot" | "warm" | "cold" | null;
  assigned_to?: string | null;
};

export type UpdateLeadInput = {
  full_name?: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  status_id?: string | null;
  priority?: "hot" | "warm" | "cold" | null;
  assigned_to?: string | null;
  position?: number;
};

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createLeadAction(
  input: CreateLeadInput
): Promise<ActionResult<any>> {
  try {
    const supabase = await supabaseServer();

    // default priority
    const payload = {
      full_name: input.full_name.trim(),
      phone: input.phone ?? null,
      email: input.email ?? null,
      source: input.source ?? null,
      status_id: input.status_id ?? null,
      priority: input.priority ?? "warm",
      assigned_to: input.assigned_to ?? null,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Unknown error" };
  }
}

export async function updateLeadAction(
  leadId: string,
  patch: UpdateLeadInput
): Promise<ActionResult<any>> {
  try {
    const supabase = await supabaseServer();

    const cleanPatch: any = { ...patch };
    if (typeof cleanPatch.full_name === "string") {
      cleanPatch.full_name = cleanPatch.full_name.trim();
    }

    const { data, error } = await supabase
      .from("leads")
      .update(cleanPatch)
      .eq("id", leadId)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Unknown error" };
  }
}

export async function moveLeadAction(
  leadId: string,
  toStatusId: string | null,
  toPosition: number
): Promise<ActionResult<any>> {
  try {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("leads")
      .update({
        status_id: toStatusId,
        position: toPosition,
      })
      .eq("id", leadId)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Unknown error" };
  }
}

export async function deleteLeadAction(
  leadId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase.from("leads").delete().eq("id", leadId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true, data: { id: leadId } };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Unknown error" };
  }
}
