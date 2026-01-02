"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

export type Lead = {
  id: string;

  // basic
  full_name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  notes: string | null;

  status: LeadStatus;
  assigned_to: string | null;
  follow_up_at: string | null;
  created_at: string;

  // detailed flight form fields
  departure: string | null;
  destination: string | null;
  travel_date: string | null;
  return_date: string | null;

  pax_adults: number | null;
  pax_children: number | null;
  pax_infants: number | null;

  budget: string | null;
  airline: string | null;
  cabin: string | null;
};

export type Agent = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; message: string };

function clean(v?: string | null) {
  return (v ?? "").trim();
}

export async function listAgentsAction(): Promise<Ok<Agent[]> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("agents")
      .select("id,full_name,email")
      .order("created_at", { ascending: true });

    if (error) return { ok: false, message: error.message };
    return { ok: true, data: (data ?? []) as Agent[] };
  } catch (e: any) {
    return { ok: false, message: e?.message || "Failed to load agents" };
  }
}

export async function createLeadAction(input: {
  full_name?: string;
  phone?: string;
  email?: string;
  source?: string;
  notes?: string;
  status?: LeadStatus;
  assigned_to?: string | null;
  follow_up_at?: string | null;

  departure?: string;
  destination?: string;
  travel_date?: string;
  return_date?: string;

  pax_adults?: number;
  pax_children?: number;
  pax_infants?: number;

  budget?: string;
  airline?: string;
  cabin?: string;
}): Promise<Ok<Lead> | Fail> {
  try {
    const supabase = await supabaseServer();

    const payload = {
      full_name: clean(input.full_name) || null,
      phone: clean(input.phone) || null,
      email: clean(input.email) || null,
      source: clean(input.source) || null,
      notes: clean(input.notes) || null,
      status: (input.status ?? "New") as LeadStatus,
      assigned_to: input.assigned_to ?? null,
      follow_up_at: input.follow_up_at ?? null,

      departure: clean(input.departure) || null,
      destination: clean(input.destination) || null,
      travel_date: clean(input.travel_date) || null,
      return_date: clean(input.return_date) || null,

      pax_adults: typeof input.pax_adults === "number" ? input.pax_adults : null,
      pax_children: typeof input.pax_children === "number" ? input.pax_children : null,
      pax_infants: typeof input.pax_infants === "number" ? input.pax_infants : null,

      budget: clean(input.budget) || null,
      airline: clean(input.airline) || null,
      cabin: clean(input.cabin) || null,
    };

    const { data, error } = await supabase.from("leads").insert(payload).select("*").single();

    if (error) return { ok: false, message: error.message };
    return { ok: true, data: data as Lead };
  } catch (e: any) {
    return { ok: false, message: e?.message || "Failed to create lead" };
  }
}

export async function moveLeadAction(input: {
  id: string;
  status: LeadStatus;
}): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("leads")
      .update({ status: input.status })
      .eq("id", input.id);

    if (error) return { ok: false, message: error.message };
    return { ok: true, data: true };
  } catch (e: any) {
    return { ok: false, message: e?.message || "Failed to move lead" };
  }
}

export async function assignLeadAction(input: {
  id: string;
  assigned_to: string | null;
}): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("leads")
      .update({ assigned_to: input.assigned_to })
      .eq("id", input.id);

    if (error) return { ok: false, message: error.message };
    return { ok: true, data: true };
  } catch (e: any) {
    return { ok: false, message: e?.message || "Failed to assign lead" };
  }
}
