"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

/** ===== Types ===== */

export type LeadStatus = {
  id: string;
  label: string;
  position: number;
  color?: string | null;
};

export type Agent = {
  id: string;
  full_name: string | null; // (tumhare profiles me full_name me email bhi ho sakta)
  role: string | null;      // admin / agent / etc
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

  details: any;

  // travel fields (schema ke mutabiq)
  trip_type: "oneway" | "return" | "multicity" | null;
  departure: string | null;
  destination: string | null;
  depart_date: string | null;   // date => string
  return_date: string | null;   // date => string
  adults: number | null;
  children: number | null;
  infants: number | null;
  cabin_class: "economy" | "premium" | "business" | "first" | null;
  budget: string | null;
  preferred_airline: string | null;
  whatsapp: string | null;
  notes: string | null;
  follow_up_date: string | null; // date => string
  whatsapp_text: string | null;
};

export type CreateLeadInput = {
  // required
  full_name: string;
  status_id: string;

  // basic optional
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  priority?: "hot" | "warm" | "cold" | null;
  assigned_to?: string | null;

  // travel optional (schema ke mutabiq)
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

  // details json
  details?: any;
};

export type CreateLeadResult =
  | { ok: true; lead: Lead }
  | { ok: false; error: string };

export type MoveLeadInput = {
  fromStatusId: string;
  toStatusId: string;
  fromOrderIds: string[];
  toOrderIds: string[];
};

/** ===== Helpers ===== */
function toLead(row: any): Lead {
  return {
    id: row.id ?? "",

    full_name: row.full_name ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    source: row.source ?? null,

    status_id: row.status_id ?? "",
    position: typeof row.position === "number" ? row.position : Number(row.position ?? 0),

    priority: (row.priority ?? null) as any,

    assigned_to: row.assigned_to ?? null,
    created_by: row.created_by ?? null,

    last_activity_at: row.last_activity_at ?? null,
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",

    details: row.details ?? {},

    trip_type: (row.trip_type ?? null) as any,
    departure: row.departure ?? null,
    destination: row.destination ?? null,
    depart_date: row.depart_date ?? null,
    return_date: row.return_date ?? null,
    adults: typeof row.adults === "number" ? row.adults : row.adults ?? null,
    children: typeof row.children === "number" ? row.children : row.children ?? null,
    infants: typeof row.infants === "number" ? row.infants : row.infants ?? null,
    cabin_class: (row.cabin_class ?? null) as any,
    budget: row.budget ?? null,
    preferred_airline: row.preferred_airline ?? null,
    whatsapp: row.whatsapp ?? null,
    notes: row.notes ?? null,
    follow_up_date: row.follow_up_date ?? null,
    whatsapp_text: row.whatsapp_text ?? null,
  };
}

/** ===== Actions ===== */

export async function createLeadAction(input: CreateLeadInput): Promise<CreateLeadResult> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    const full_name = (input.full_name ?? "").trim();
    if (!full_name) return { ok: false, error: "Full name is required." };
    if (!input.status_id) return { ok: false, error: "Status is required." };

    // base payload
    const payload: Record<string, any> = {
      full_name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      source: input.source ?? null,
      priority: input.priority ?? "warm",
      status_id: input.status_id,
      assigned_to: input.assigned_to ?? null,
      details: input.details ?? {},
    };

    // travel fields (only if provided)
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
    ];

    for (const k of optionalKeys) {
      if (k in input) payload[k] = (input as any)[k] ?? null;
    }

    // next position
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
    return { ok: true, lead: toLead(data) };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}

export async function moveLeadAction(input: MoveLeadInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    // update "from"
    for (let i = 0; i < input.fromOrderIds.length; i++) {
      const id = input.fromOrderIds[i];
      const { error } = await supabase.from("leads").update({ status_id: input.fromStatusId, position: i }).eq("id", id);
      if (error) return { ok: false, error: error.message };
    }

    // update "to"
    for (let i = 0; i < input.toOrderIds.length; i++) {
      const id = input.toOrderIds[i];
      const { error } = await supabase.from("leads").update({ status_id: input.toStatusId, position: i }).eq("id", id);
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath("/leads");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}

/**
 * Agents list (profiles table se)
 * NOTE: profiles ka schema tumhare screenshot me: id, full_name, role, created_at
 */
export async function listAgentsAction(): Promise<{ ok: true; agents: Agent[] } | { ok: false; error: string }> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("created_at", { ascending: true });

    if (error) return { ok: false, error: error.message };

    const agents: Agent[] = (data ?? []).map((r: any) => ({
      id: r.id,
      full_name: r.full_name ?? null,
      role: r.role ?? null,
    }));

    return { ok: true, agents };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}

/**
 * ✅ BACKWARD COMPATIBILITY LOCK:
 * Agar kisi file me getAgentsAction import ho, to build kabhi break nahi hoga.
 */
export async function getAgentsAction() {
  return listAgentsAction();
}
