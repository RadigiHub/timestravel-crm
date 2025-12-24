"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * NOTE:
 * - These actions are used by Client Components via server actions.
 * - Keep exports stable: AddLeadForm.tsx expects `createLeadAction`.
 */

type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

function toNull(v: FormDataEntryValue | null) {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function toString(v: FormDataEntryValue | null, fallback = "") {
  if (v === null) return fallback;
  return String(v).trim();
}

function toNumber(v: FormDataEntryValue | null, fallback = 0) {
  const n = Number(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Create lead (used by AddLeadForm.tsx)
 * Expected FormData keys (safe if some are missing):
 * - full_name, phone, email, source, status_id, priority, assigned_to
 */
export async function createLeadAction(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await supabaseServer();

    const full_name = toString(formData.get("full_name"));
    if (!full_name) return { ok: false, error: "Full name is required." };

    const phone = toNull(formData.get("phone"));
    const email = toNull(formData.get("email"));
    const source = toNull(formData.get("source"));

    const status_id = toNull(formData.get("status_id")); // can be null => backend default or first status
    const assigned_to = toNull(formData.get("assigned_to"));

    const priorityRaw = toNull(formData.get("priority"));
    const priority =
      priorityRaw === "hot" || priorityRaw === "warm" || priorityRaw === "cold"
        ? priorityRaw
        : "warm";

    // Optional manual position, otherwise default 0
    const position = toNumber(formData.get("position"), 0);

    const payload: Record<string, any> = {
      full_name,
      phone,
      email,
      source,
      priority,
      assigned_to,
      position,
    };

    // Only attach status_id if provided (avoid null index issues)
    if (status_id) payload.status_id = status_id;

    const { data, error } = await supabase.from("leads").insert(payload).select("*").single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}

/**
 * Update lead fields (used by LeadCard / Action modal etc.)
 * You can pass partial patch fields.
 */
export async function updateLeadAction(
  leadId: string,
  patch: Record<string, any>
): Promise<ActionResult> {
  try {
    const supabase = await supabaseServer();
    if (!leadId) return { ok: false, error: "Missing leadId." };

    const { data, error } = await supabase
      .from("leads")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", leadId)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}

/**
 * Move lead across status + set position (used by Board drag-drop)
 */
export async function moveLeadAction(
  leadId: string,
  toStatusId: string,
  toPosition: number
): Promise<ActionResult> {
  try {
    const supabase = await supabaseServer();
    if (!leadId) return { ok: false, error: "Missing leadId." };
    if (!toStatusId) return { ok: false, error: "Missing status id." };

    const { data, error } = await supabase
      .from("leads")
      .update({
        status_id: toStatusId,
        position: toPosition,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}

/**
 * Delete lead (optional future use)
 */
export async function deleteLeadAction(leadId: string): Promise<ActionResult> {
  try {
    const supabase = await supabaseServer();
    if (!leadId) return { ok: false, error: "Missing leadId." };

    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
