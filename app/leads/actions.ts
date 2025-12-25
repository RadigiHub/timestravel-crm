"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type LeadStatus = {
  id: string;
  label: string;
  position: number;
  color?: string | null;
};

export type Lead = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  status_id: string;
  position: number;
  priority: "hot" | "warm" | "cold" | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateLeadInput = {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  priority?: "hot" | "warm" | "cold";
  status_id: string;
};

export type CreateLeadResult =
  | { ok: true; lead: Lead }
  | { ok: false; error: string };

export async function createLeadAction(input: CreateLeadInput): Promise<CreateLeadResult> {
  const supabase = await supabaseServer();

  const name = (input.full_name ?? "").trim();
  if (!name) return { ok: false, error: "Full name is required." };
  if (!input.status_id) return { ok: false, error: "Status is required." };

  const payload = {
    full_name: name,
    phone: input.phone ?? null,
    email: input.email ?? null,
    source: input.source ?? "web",
    priority: input.priority ?? "warm",
    status_id: input.status_id,
    position: 0,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/leads");
  return { ok: true, lead: data as Lead };
}

export type MoveLeadInput = {
  fromStatusId: string;
  toStatusId: string;
  fromOrderIds: string[];
  toOrderIds: string[];
};

export async function moveLeadAction(input: MoveLeadInput) {
  const supabase = await supabaseServer();

  // Update FROM column ordering
  const fromUpdates = (input.fromOrderIds ?? []).map((id, idx) =>
    supabase
      .from("leads")
      .update({ status_id: input.fromStatusId, position: idx })
      .eq("id", id)
  );

  // Update TO column ordering
  const toUpdates = (input.toOrderIds ?? []).map((id, idx) =>
    supabase
      .from("leads")
      .update({ status_id: input.toStatusId, position: idx })
      .eq("id", id)
  );

  await Promise.all([...fromUpdates, ...toUpdates]);

  revalidatePath("/leads");
}

export type UpdateLeadInput = {
  id: string;
  full_name?: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  priority?: "hot" | "warm" | "cold" | null;
  assigned_to?: string | null;
};

export async function updateLeadAction(input: UpdateLeadInput) {
  const supabase = await supabaseServer();

  const patch: any = {};
  if (typeof input.full_name === "string") patch.full_name = input.full_name.trim();
  if ("phone" in input) patch.phone = input.phone ?? null;
  if ("email" in input) patch.email = input.email ?? null;
  if ("source" in input) patch.source = input.source ?? null;
  if ("priority" in input) patch.priority = input.priority ?? null;
  if ("assigned_to" in input) patch.assigned_to = input.assigned_to ?? null;

  const { error } = await supabase.from("leads").update(patch).eq("id", input.id);
  if (error) throw new Error(error.message);

  revalidatePath("/leads");
}
