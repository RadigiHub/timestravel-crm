"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type LeadPriority = "hot" | "warm" | "cold";

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
  priority: LeadPriority;
  assigned_to: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateLeadInput = {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  priority?: LeadPriority;
  status_id: string;

  // future optional travel fields (agar DB me add ho to use karo)
  departure?: string | null;
  destination?: string | null;
  depart_date?: string | null;
  return_date?: string | null;
  pax?: number | null;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createLeadAction(input: CreateLeadInput): Promise<ActionResult<Lead>> {
  try {
    const supabase = await supabaseServer();

    const full_name = input.full_name?.trim();
    if (!full_name) return { ok: false, error: "Full name is required." };

    // position = last position + 1 in that status
    const { data: last, error: lastErr } = await supabase
      .from("leads")
      .select("position")
      .eq("status_id", input.status_id)
      .order("position", { ascending: false })
      .limit(1);

    if (lastErr) return { ok: false, error: lastErr.message };

    const nextPos = (last?.[0]?.position ?? -1) + 1;

    const payload: any = {
      full_name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      source: input.source ?? null,
      priority: input.priority ?? "warm",
      status_id: input.status_id,
      position: nextPos,

      // optional travel fields (safe even if columns not exist? -> if columns don't exist, remove these 6 lines)
      departure: input.departure ?? null,
      destination: input.destination ?? null,
      depart_date: input.depart_date ?? null,
      return_date: input.return_date ?? null,
      pax: input.pax ?? null,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    return { ok: true, data: data as Lead };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}

export type MoveLeadInput = {
  fromStatusId: string;
  toStatusId: string;
  fromOrderIds: string[];
  toOrderIds: string[];
};

export async function moveLeadAction(input: MoveLeadInput): Promise<ActionResult<true>> {
  try {
    const supabase = await supabaseServer();

    // update from column positions
    for (let i = 0; i < input.fromOrderIds.length; i++) {
      const id = input.fromOrderIds[i];
      const { error } = await supabase
        .from("leads")
        .update({ position: i })
        .eq("id", id);

      if (error) return { ok: false, error: error.message };
    }

    // update to column positions + status
    for (let i = 0; i < input.toOrderIds.length; i++) {
      const id = input.toOrderIds[i];
      const { error } = await supabase
        .from("leads")
        .update({ status_id: input.toStatusId, position: i })
        .eq("id", id);

      if (error) return { ok: false, error: error.message };
    }

    return { ok: true, data: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
