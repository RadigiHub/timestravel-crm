"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

/**
 * Backwards compatibility:
 * Kuch files me LeadStage use ho raha tha.
 * Isko LeadStatus ka alias bana diya so build kabhi na toote.
 */
export type LeadStage = LeadStatus;

/**
 * Agents are stored in public.profiles (role='agent')
 * We'll return a shape that is easy to render in dropdowns.
 */
export type Agent = {
  id: string;
  full_name: string | null;
  email: string | null;
};

/** Brands are stored in public.brands */
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

  /**
   * IMPORTANT:
   * We will use agent_id (FK -> profiles.id) for assignment.
   * assigned_to exists but points to auth.users; keep it for compatibility only.
   */
  agent_id?: string | null;
  brand_id?: string | null;

  // legacy/compat
  assigned_to?: string | null;

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

/**
 * ✅ List agents from public.profiles where role = 'agent'
 */
export async function listAgentsAction(): Promise<Ok<Agent[]> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,email,role,created_at")
      .eq("role", "agent")
      .order("full_name", { ascending: true });

    if (error) return { ok: false, error: error.message };

    return { ok: true, data: (data ?? []) as Agent[] };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

/**
 * ✅ List brands from public.brands
 */
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

/**
 * ✅ Create lead
 * Writes to leads table:
 * - status (string)
 * - agent_id (profiles.id) optional
 * - brand_id (brands.id) optional
 *
 * NOTE: Your leads table has many columns.
 * We only insert what's needed; defaults handle the rest.
 */
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

      // ✅ Use agent_id + brand_id
      agent_id: payload.agent_id ?? null,
      brand_id: payload.brand_id ?? null,

      // legacy - keep if some UI still sends it
      assigned_to: payload.assigned_to ?? null,

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

/**
 * ✅ Move lead between columns (status string)
 */
export async function moveLeadAction(args: { id: string; status: LeadStatus }): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("leads")
      .update({ status: args.status })
      .eq("id", args.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

/**
 * ✅ Assign lead to an agent (profiles.id) via agent_id
 * This is the correct mapping for your schema.
 */
export async function assignLeadAction(args: { id: string; agent_id: string | null }): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("leads")
      .update({ agent_id: args.agent_id })
      .eq("id", args.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
