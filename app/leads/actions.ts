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
  created_by: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;

  details: any; // jsonb

  // Travel / CRM fields (as per your Supabase schema)
  trip_type: "oneway" | "return" | "multicity" | null;
  departure: string | null;
  destination: string | null;
  depart_date: string | null; // YYYY-MM-DD
  return_date: string | null; // YYYY-MM-DD
  adults: number | null;
  children: number | null;
  infants: number | null;
  cabin_class: "economy" | "premium" | "business" | "first" | null;
  budget: string | null;
  preferred_airline: string | null;
  whatsapp: string | null;
  notes: string | null;
  follow_up_date: string | null; // YYYY-MM-DD
  whatsapp_text: string | null;
};

export type CreateLeadInput = {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  priority?: "hot" | "warm" | "cold";
  status_id: string;

  // Extra fields (all optional)
  trip_type?: "oneway" | "return" | "multicity" | null;
  departure?: string | null;
  destination?: string | null;
  depart_date?: string | null; // YYYY-MM-DD
  return_date?: string | null; // YYYY-MM-DD
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  cabin_class?: "economy" | "premium" | "business" | "first" | null;
  budget?: string | null;
  preferred_airline?: string | null;
  whatsapp?: string | null;
  notes?: string | null;
  follow_up_date?: string | null; // YYYY-MM-DD
  whatsapp_text?: string | null;
  details?: any; // jsonb
};

export type CreateLeadResult =
  | { ok: true; lead: Lead }
  | { ok: false; error: string };

export async function createLeadAction(input: CreateLeadInput): Promise<CreateLeadResult> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    const full_name = (input.full_name ?? "").trim();
    if (!full_name) return { ok: false, error: "Full name is required." };
    if (!input.status_id) return { ok: false, error: "Status is required." };

    // Get next position for this status
    const { data: maxPosRow, error: maxErr } = await supabase
      .from("leads")
      .select("position")
      .eq("status_id", input.status_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) return { ok: false, error: maxErr.message };

    const nextPos = typeof maxPosRow?.position === "number" ? maxPosRow.position + 1 : 0;

    // Build payload (match DB column names)
    const payload: Record<string, any> = {
      full_name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      source: input.source ?? null,
      priority: input.priority ?? "warm",
      status_id: input.status_id,
      position: nextPos,

      created_by: auth.user.id, // optional but useful
      // assigned_to left null by default
    };

    // Add optional fields only if present in input
    const optionalKeys: (keyof CreateLeadInput)[] = [
      "trip_type",
      "departure",
      "destination",
      "depart_date",
      "return_date",
      "adults",
      "children",
      "infants",
      "cabin_class",
      "budget",
      "preferred_airline",
      "whatsapp",
      "notes",
      "follow_up_date",
      "whatsapp_text",
      "details",
    ];

    for (const k of optionalKeys) {
      if (k in input) payload[k] = (input as any)[k] ?? null;
    }

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

export async function moveLeadAction(input: MoveLeadInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    // update "from" column positions
    for (let i = 0; i < input.fromOrderIds.length; i++) {
      const id = input.fromOrderIds[i];
      const { error } = await supabase
        .from("leads")
        .update({
          status_id: input.fromStatusId,
          position: i,
        })
        .eq("id", id);

      if (error) return { ok: false, error: error.message };
    }

    // update "to" column positions
    for (let i = 0; i < input.toOrderIds.length; i++) {
      const id = input.toOrderIds[i];
      const { error } = await supabase
        .from("leads")
        .update({
          status_id: input.toStatusId,
          position: i,
        })
        .eq("id", id);

      if (error) return { ok: false, error: error.message };
    }

    revalidatePath("/leads");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
