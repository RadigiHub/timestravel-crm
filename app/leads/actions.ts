"use server";

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
  position: number | null;
  priority: "hot" | "warm" | "cold" | null;
  assigned_to: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateLeadInput = {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  priority?: "hot" | "warm" | "cold" | null;
  status_id: string;
  assigned_to?: string | null;
};

export async function createLeadAction(input: CreateLeadInput) {
  try {
    const supabase = await supabaseServer();

    const payload = {
      full_name: input.full_name?.trim() || null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      source: input.source ?? null,
      priority: input.priority ?? "warm",
      status_id: input.status_id,
      assigned_to: input.assigned_to ?? null,
    };

    if (!payload.full_name) {
      return { ok: false as const, error: "Full name is required." };
    }
    if (!payload.status_id) {
      return { ok: false as const, error: "Status is required." };
    }

    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("*")
      .single();

    if (error) return { ok: false as const, error: error.message };

    return { ok: true as const, lead: data as Lead };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? "Create lead failed." };
  }
}

export async function moveLeadAction(args: {
  fromStatusId: string;
  toStatusId: string;
  fromOrderIds: string[];
  toOrderIds: string[];
}) {
  const supabase = await supabaseServer();

  // update positions in source column
  if (args.fromStatusId) {
    for (let i = 0; i < args.fromOrderIds.length; i++) {
      const id = args.fromOrderIds[i];
      await supabase.from("leads").update({ position: i }).eq("id", id);
    }
  }

  // update status + positions in destination column
  if (args.toStatusId) {
    for (let i = 0; i < args.toOrderIds.length; i++) {
      const id = args.toOrderIds[i];
      await supabase
        .from("leads")
        .update({ status_id: args.toStatusId, position: i })
        .eq("id", id);
    }
  }

  return { ok: true as const };
}

export async function updateLeadAction(args: {
  id: string;
  patch: Partial<Pick<Lead, "full_name" | "phone" | "email" | "source" | "priority" | "assigned_to">>;
}) {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("leads")
    .update(args.patch)
    .eq("id", args.id)
    .select("*")
    .single();

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, lead: data as Lead };
}
