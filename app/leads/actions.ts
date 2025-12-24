"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

/* ---------------- Types (kept flexible to avoid TS mismatch) ---------------- */

export type AddLeadInput = {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  status_id: string; // required
  priority?: "hot" | "warm" | "cold";
  assigned_to?: string | null;
  whatsapp_text?: string | null;
};

export type UpdateLeadInput = {
  id: string;
  full_name?: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  status_id?: string | null;
  position?: number | null;
  priority?: "hot" | "warm" | "cold";
  assigned_to?: string | null;
  whatsapp_text?: string | null;
};

export type MoveLeadInput =
  | {
      // ✅ Single-move style
      leadId: string;
      toStatusId: string;
      toPosition: number;
      fromStatusId?: string | null;
    }
  | {
      // ✅ Batch-reorder style (drag/drop board libs often use this)
      fromStatusId: string;
      toStatusId: string;
      fromOrderIds: string[];
      toOrderIds: string[];
    };

type ActionResult<T> =
  | { ok: true; data?: T }
  | { ok: false; error: string; details?: unknown };

function toErrorMessage(err: unknown) {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

/* ---------------- Actions ---------------- */

export async function addLeadAction(input: AddLeadInput): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await supabaseServer();

    // Auth guard
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    const full_name = (input.full_name || "").trim();
    if (!full_name) return { ok: false, error: "Full name is required" };
    if (!input.status_id) return { ok: false, error: "status_id is required" };

    // Find next position inside the status column
    const { data: maxRow, error: maxErr } = await supabase
      .from("leads")
      .select("position")
      .eq("status_id", input.status_id)
      .order("position", { ascending: false })
      .limit(1);

    if (maxErr) return { ok: false, error: "Failed to read positions", details: maxErr };

    const nextPos = (maxRow?.[0]?.position ?? 0) + 1;

    const payload = {
      full_name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      source: input.source ?? null,
      status_id: input.status_id,
      position: nextPos,
      priority: input.priority ?? "warm",
      assigned_to: input.assigned_to ?? null,
      whatsapp_text: input.whatsapp_text ?? null,
    };

    const { data, error } = await supabase.from("leads").insert(payload).select("id").single();

    if (error) return { ok: false, error: "Failed to add lead", details: error };

    revalidatePath("/leads");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e), details: e };
  }
}

export async function updateLeadAction(input: UpdateLeadInput): Promise<ActionResult<null>> {
  try {
    const supabase = await supabaseServer();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    if (!input?.id) return { ok: false, error: "id is required" };

    const updates: Record<string, any> = {};
    if (typeof input.full_name === "string") updates.full_name = input.full_name.trim();
    if ("phone" in input) updates.phone = input.phone ?? null;
    if ("email" in input) updates.email = input.email ?? null;
    if ("source" in input) updates.source = input.source ?? null;
    if ("status_id" in input) updates.status_id = input.status_id ?? null;
    if ("position" in input) updates.position = input.position ?? null;
    if (input.priority) updates.priority = input.priority;
    if ("assigned_to" in input) updates.assigned_to = input.assigned_to ?? null;
    if ("whatsapp_text" in input) updates.whatsapp_text = input.whatsapp_text ?? null;

    // nothing to update
    if (Object.keys(updates).length === 0) return { ok: true, data: null };

    const { error } = await supabase.from("leads").update(updates).eq("id", input.id);
    if (error) return { ok: false, error: "Failed to update lead", details: error };

    revalidatePath("/leads");
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e), details: e };
  }
}

export async function deleteLeadAction(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await supabaseServer();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    if (!id) return { ok: false, error: "id is required" };

    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return { ok: false, error: "Failed to delete lead", details: error };

    revalidatePath("/leads");
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e), details: e };
  }
}

/**
 * Handles both:
 * 1) { leadId, toStatusId, toPosition }
 * 2) { fromStatusId, toStatusId, fromOrderIds, toOrderIds }
 */
export async function moveLeadAction(input: MoveLeadInput): Promise<ActionResult<null>> {
  try {
    const supabase = await supabaseServer();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    // ---- Case 2: batch reorder
    if ("fromOrderIds" in input && "toOrderIds" in input) {
      const { fromStatusId, toStatusId, fromOrderIds, toOrderIds } = input;

      // Update all leads in FROM column positions
      for (let i = 0; i < fromOrderIds.length; i++) {
        const id = fromOrderIds[i];
        const { error } = await supabase
          .from("leads")
          .update({ status_id: fromStatusId, position: i + 1 })
          .eq("id", id);
        if (error) return { ok: false, error: "Failed updating from column order", details: error };
      }

      // Update all leads in TO column positions
      for (let i = 0; i < toOrderIds.length; i++) {
        const id = toOrderIds[i];
        const { error } = await supabase
          .from("leads")
          .update({ status_id: toStatusId, position: i + 1 })
          .eq("id", id);
        if (error) return { ok: false, error: "Failed updating to column order", details: error };
      }

      revalidatePath("/leads");
      return { ok: true, data: null };
    }

    // ---- Case 1: single move
    const leadId = "leadId" in input ? input.leadId : "";
    const toStatusId = "toStatusId" in input ? input.toStatusId : "";
    const toPosition = "toPosition" in input ? input.toPosition : 1;

    if (!leadId || !toStatusId) return { ok: false, error: "leadId and toStatusId are required" };

    const { error } = await supabase
      .from("leads")
      .update({
        status_id: toStatusId,
        position: toPosition,
      })
      .eq("id", leadId);

    if (error) return { ok: false, error: "Failed to move lead", details: error };

    revalidatePath("/leads");
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e), details: e };
  }
}
