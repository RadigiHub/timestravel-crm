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
  full_name: string; // NOT NULL in DB
  phone: string | null;
  email: string | null;
  source: string | null;
  status_id: string;
  position: number;
  priority: "hot" | "warm" | "cold";
  assigned_to: string | null;

  created_by: string | null;
  last_activity_at: string | null;

  created_at: string;
  updated_at: string;

  // extra CRM fields
  details: Record<string, any>; // jsonb

  trip_type: "oneway" | "return" | "multicity";
  departure: string | null;
  destination: string | null;
  depart_date: string | null;   // YYYY-MM-DD
  return_date: string | null;   // YYYY-MM-DD

  adults: number;
  children: number;
  infants: number;

  cabin_class: "economy" | "premium" | "business" | "first";
  budget: string | null;
  preferred_airline: string | null;
  whatsapp: string | null;
  notes: string | null;
  follow_up_date: string | null; // YYYY-MM-DD
  whatsapp_text: string | null;
};

export type CreateLeadInput = {
  // required
  full_name: string;
  status_id: string;

  // optional basics
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  priority?: "hot" | "warm" | "cold";
  assigned_to?: string | null;

  // travel / CRM
  trip_type?: "oneway" | "return" | "multicity";
  departure?: string | null;
  destination?: string | null;
  depart_date?: string | null;   // YYYY-MM-DD
  return_date?: string | null;   // YYYY-MM-DD

  adults?: number;
  children?: number;
  infants?: number;

  cabin_class?: "economy" | "premium" | "business" | "first";
  budget?: string | null;
  preferred_airline?: string | null;
  whatsapp?: string | null;
  notes?: string | null;
  follow_up_date?: string | null; // YYYY-MM-DD
  whatsapp_text?: string | null;

  // json extra
  details?: Record<string, any>;
};

export type CreateLeadResult =
  | { ok: true; lead: Lead }
  | { ok: false; error: string };

function toIntSafe(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function createLeadAction(input: CreateLeadInput): Promise<CreateLeadResult> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    const full_name = (input.full_name ?? "").trim();
    if (!full_name) return { ok: false, error: "Full name is required." };

    const status_id = (input.status_id ?? "").trim();
    if (!status_id) return { ok: false, error: "Status is required." };

    // next position for that status
    const { data: maxPosRow, error: maxErr } = await supabase
      .from("leads")
      .select("position")
      .eq("status_id", status_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) return { ok: false, error: maxErr.message };

    const nextPos = typeof maxPosRow?.position === "number" ? maxPosRow.position + 1 : 0;

    const payload: Record<string, any> = {
      full_name,
      status_id,
      position: nextPos,

      phone: input.phone ?? null,
      email: input.email ?? null,
      source: input.source ?? null,

      priority: input.priority ?? "warm",
      assigned_to: input.assigned_to ?? null,

      trip_type: input.trip_type ?? "return",
      departure: input.departure ?? null,
      destination: input.destination ?? null,
      depart_date: input.depart_date ?? null,
      return_date: input.return_date ?? null,

      adults: toIntSafe(input.adults, 1),
      children: toIntSafe(input.children, 0),
      infants: toIntSafe(input.infants, 0),

      cabin_class: input.cabin_class ?? "economy",
      budget: input.budget ?? null,
      preferred_airline: input.preferred_airline ?? null,
      whatsapp: input.whatsapp ?? null,
      notes: input.notes ?? null,
      follow_up_date: input.follow_up_date ?? null,
      whatsapp_text: input.whatsapp_text ?? null,

      details: input.details ?? {},
    };

    // created_by column exists; set it (safe)
    payload.created_by = auth.user.id;

    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true, lead: data as Lead };
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

export async function moveLeadAction(
  input: MoveLeadInput
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    // update "from" column positions
    for (let i = 0; i < input.fromOrderIds.length; i++) {
      const id = input.fromOrderIds[i];
      const { error } = await supabase
        .from("leads")
        .update({ status_id: input.fromStatusId, position: i })
        .eq("id", id);

      if (error) return { ok: false, error: error.message };
    }

    // update "to" column positions
    for (let i = 0; i < input.toOrderIds.length; i++) {
      const id = input.toOrderIds[i];
      const { error } = await supabase
        .from("leads")
        .update({ status_id: input.toStatusId, position: i })
        .eq("id", id);

      if (error) return { ok: false, error: error.message };
    }

    revalidatePath("/leads");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
