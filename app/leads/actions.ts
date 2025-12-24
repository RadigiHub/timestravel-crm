"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

/* ================= TYPES ================= */

export type TripType = "oneway" | "return" | "multicity";
export type Priority = "hot" | "warm" | "cold";
export type CabinClass = "economy" | "premium" | "business" | "first";

export type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string | null;

  status_id: string;
  position: number;
  priority: Priority;

  trip_type: TripType;
  departure: string | null;
  destination: string | null;
  depart_date: string | null;
  return_date: string | null;

  adults: number;
  children: number;
  infants: number;

  cabin_class: CabinClass;
  preferred_airline: string | null;
  budget: string | null;
  whatsapp_text: string | null;
  follow_up_date: string | null;
  notes: string | null;

  created_by: string | null;
  assigned_to: string | null;

  created_at: string;
  updated_at: string;
};

export type CreateLeadInput = {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;

  // board
  status_id: string;
  priority?: Priority;

  // travel (recommended to fill; DB constraints might require these)
  trip_type?: TripType;
  departure?: string | null;
  destination?: string | null;
  depart_date?: string | null;
  return_date?: string | null;

  adults?: number;
  children?: number;
  infants?: number;

  cabin_class?: CabinClass;
  preferred_airline?: string | null;
  budget?: string | null;
  whatsapp_text?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;

  // admin use-case (optional)
  assigned_to?: string | null;
};

export type CreateLeadResult =
  | { ok: true; lead: Lead }
  | { ok: false; error: string };

/* ================= HELPERS ================= */

function safeTrim(v: unknown): string {
  return String(v ?? "").trim();
}

function toInt(v: unknown, fallback: number) {
  const n = Number(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

/* ================= CREATE LEAD ================= */

export async function createLeadAction(input: CreateLeadInput): Promise<CreateLeadResult> {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) return { ok: false, error: "Not authenticated" };

  const full_name = safeTrim(input.full_name);
  const status_id = safeTrim(input.status_id);

  // ✅ minimal validation
  if (!full_name) return { ok: false, error: "Full name is required" };
  if (!status_id) return { ok: false, error: "Status is required" };

  // Travel (keep defaults safe)
  const trip_type = (input.trip_type ?? "return") as TripType;
  const departure = safeTrim(input.departure) || null;
  const destination = safeTrim(input.destination) || null;
  const depart_date = safeTrim(input.depart_date) || null;
  const return_date = safeTrim(input.return_date) || null;

  const adults = toInt(input.adults, 1);
  const children = toInt(input.children, 0);
  const infants = toInt(input.infants, 0);

  const cabin_class = (input.cabin_class ?? "economy") as CabinClass;
  const priority = (input.priority ?? "warm") as Priority;

  const preferred_airline = safeTrim(input.preferred_airline) || null;
  const budget = safeTrim(input.budget) || null;
  const whatsapp_text = safeTrim(input.whatsapp_text) || null;
  const follow_up_date = safeTrim(input.follow_up_date) || null;
  const notes = safeTrim(input.notes) || null;

  // ✅ If your DB requires travel fields, enforce here
  // (agar tumhare leads table me NOT NULL ho to yeh لازمی hai)
  if (!departure) return { ok: false, error: "Departure is required" };
  if (!destination) return { ok: false, error: "Destination is required" };
  if (!depart_date) return { ok: false, error: "Depart date is required" };
  if (trip_type === "return" && !return_date)
    return { ok: false, error: "Return date is required" };
  if (adults < 1) return { ok: false, error: "Adults must be at least 1" };

  // Position in column
  const { data: last, error: lastErr } = await supabase
    .from("leads")
    .select("position")
    .eq("status_id", status_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) return { ok: false, error: lastErr.message };

  const nextPos = (last?.position ?? -1) + 1;

  const assigned_to = input.assigned_to ?? auth.user.id;

  const payload = {
    full_name,
    phone: input.phone ?? null,
    email: input.email ?? null,
    source: input.source ?? "web",
    priority,

    trip_type,
    departure,
    destination,
    depart_date,
    return_date,
    adults,
    children,
    infants,
    cabin_class,
    preferred_airline,
    budget,
    whatsapp_text,
    follow_up_date,
    notes,

    status_id,
    position: nextPos,

    created_by: auth.user.id,
    assigned_to,
    last_activity_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await supabase
    .from("leads")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/leads");
  return { ok: true, lead: inserted as Lead };
}

/* ================= MOVE LEAD (DRAG & DROP) ================= */

export async function moveLeadAction(input: {
  fromStatusId: string;
  toStatusId: string;
  fromOrderIds: string[];
  toOrderIds: string[];
}) {
  const supabase = await supabaseServer();

  // FROM reorder
  for (let i = 0; i < input.fromOrderIds.length; i++) {
    const id = input.fromOrderIds[i];
    const { error } = await supabase
      .from("leads")
      .update({ status_id: input.fromStatusId, position: i })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  // TO reorder
  for (let i = 0; i < input.toOrderIds.length; i++) {
    const id = input.toOrderIds[i];
    const { error } = await supabase
      .from("leads")
      .update({ status_id: input.toStatusId, position: i })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  revalidatePath("/leads");
  return { ok: true };
}
