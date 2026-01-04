"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

/** Backwards compatibility */
export type LeadStage = LeadStatus;

export type Agent = {
  id: string;
  full_name: string | null;
  email?: string | null;
  role?: string | null;
};

export type Brand = {
  id: string;
  name: string;
};

export type Lead = {
  id: string;

  full_name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  notes: string | null;

  status: LeadStatus;

  // ✅ canonical fields
  agent_id: string | null;
  brand_id: string | null;

  follow_up_at: string | null;
  created_at: string;

  departure: string | null;
  destination: string | null;
  travel_date: string | null;
  return_date: string | null;

  pax_adults: number | null;
  pax_children: number | null;
  pax_infants: number | null;

  budget: number | null;
  airline: string | null;
  cabin: string | null;
};

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; error: string };

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Unknown error";
}

export async function listAgentsAction(): Promise<Ok<Agent[]> | Fail> {
  try {
    const supabase = await supabaseServer();

    // ✅ agents = profiles table (role = agent)
    // ✅ include email so UI fallback can show email if name missing
    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,email,role")
      .eq("role", "agent")
      .order("full_name", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as Agent[] };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function listBrandsAction(): Promise<Ok<Brand[]> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("brands")
      .select("id,name")
      .order("name", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as Brand[] };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function createLeadAction(payload: Partial<Lead>): Promise<Ok<Lead> | Fail> {
  try {
    const supabase = await supabaseServer();

    const insertRow: any = {
      full_name: payload.full_name ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      source: payload.source ?? null,
      notes: payload.notes ?? null,

      status: (payload.status ?? "New") as LeadStatus,

      agent_id: payload.agent_id ?? null,
      brand_id: payload.brand_id ?? null,

      follow_up_at: payload.follow_up_at ?? null,

      departure: payload.departure ?? null,
      destination: payload.destination ?? null,
      travel_date: payload.travel_date ?? null,
      return_date: payload.return_date ?? null,

      pax_adults: payload.pax_adults ?? null,
      pax_children: payload.pax_children ?? null,
      pax_infants: payload.pax_infants ?? null,

      budget: payload.budget ?? null,
      airline: payload.airline ?? null,
      cabin: payload.cabin ?? null,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(insertRow)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Lead };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function moveLeadAction(args: { id: string; status: LeadStatus }): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase.from("leads").update({ status: args.status }).eq("id", args.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function assignLeadAction(args: { id: string; agent_id: string | null }): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase.from("leads").update({ agent_id: args.agent_id }).eq("id", args.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
