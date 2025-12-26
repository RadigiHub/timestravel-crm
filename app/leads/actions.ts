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
  created_by?: string | null;
  last_activity_at?: string | null;

  created_at: string;
  updated_at: string;

  details?: any;

  // travel + notes (tumhari table me present hain)
  trip_type?: "oneway" | "return" | "multicity" | null;
  departure?: string | null;
  destination?: string | null;
  depart_date?: string | null; // Next usually returns string
  return_date?: string | null;

  adults?: number | null;
  children?: number | null;
  infants?: number | null;

  cabin_class?: "economy" | "premium" | "business" | "first" | null;
  budget?: string | null;
  preferred_airline?: string | null;

  whatsapp?: string | null;
  notes?: string | null;
  follow_up_date?: string | null;
  whatsapp_text?: string | null;
};

export type CreateLeadInput = {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  priority?: "hot" | "warm" | "cold";
  status_id: string;

  // optional fields that exist in DB
  trip_type?: "oneway" | "return" | "multicity" | null;
  departure?: string | null;
  destination?: string | null;
  depart_date?: string | null;
  return_date?: string | null;

  adults?: number | null;
  children?: number | null;
  infants?: number | null;

  cabin_class?: "economy" | "premium" | "business" | "first" | null;
  budget?: string | null;
  preferred_airline?: string | null;

  whatsapp?: string | null;
  notes?: string | null;
  follow_up_date?: string | null;
  whatsapp_text?: string | null;
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

    const payload: Record<string, any> = {
      full_name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      source: input.source ?? null,
      priority: input.priority ?? "warm",
      status_id: input.status_id,

      // defaults (DB also has defaults but ok)
      trip_type: input.trip_type ?? "return",
      cabin_class: input.cabin_class ?? "economy",
      adults: typeof input.adults === "number" ? input.adults : 1,
      children: typeof input.children === "number" ? input.children : 0,
      infants: typeof input.infants === "number" ? input.infants : 0,

      departure: input.departure ?? null,
      destination: input.destination ?? null,
      depart_date: input.depart_date ?? null,
      return_date: input.return_date ?? null,

      budget: input.budget ?? null,
      preferred_airline: input.preferred_airline ?? null,

      whatsapp: input.whatsapp ?? null,
      notes: input.notes ?? null,
      follow_up_date: input.follow_up_date ?? null,
      whatsapp_text: input.whatsapp_text ?? null,
    };

    // next position for status
    const { data: maxPosRow, error: maxErr } = await supabase
      .from("leads")
      .select("position")
      .eq("status_id", input.status_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) return { ok: false, error: maxErr.message };

    const nextPos = typeof maxPosRow?.position === "number" ? maxPosRow.position + 1 : 0;
    payload.position = nextPos;

    const { data, error } = await supabase.from("leads").insert(payload).select("*").single();
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

    // update "from"
    for (let i = 0; i < input.fromOrderIds.length; i++) {
      const id = input.fromOrderIds[i];
      const { error } = await supabase
        .from("leads")
        .update({ status_id: input.fromStatusId, position: i })
        .eq("id", id);

      if (error) return { ok: false, error: error.message };
    }

    // update "to"
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

/* =========================
   AGENTS + ASSIGNMENT
========================= */

export type Agent = {
  id: string;
  full_name: string | null;
  role: string | null;
  email?: string | null;
};

export async function listAgentsAction(): Promise<{ ok: true; agents: Agent[] } | { ok: false; error: string }> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    // If your table is public.profiles with columns: id, full_name, role (as screenshot)
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name", { ascending: true });

    if (error) return { ok: false, error: error.message };

    return { ok: true, agents: (data ?? []) as Agent[] };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}

export async function assignLeadAction(input: {
  leadId: string;
  assignedTo: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("leads")
      .update({ assigned_to: input.assignedTo })
      .eq("id", input.leadId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
