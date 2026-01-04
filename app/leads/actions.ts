"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

/** Backwards compatibility */
export type LeadStage = LeadStatus;

export type Agent = {
  id: string;
  full_name: string | null;
  email: string | null;
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

  // ✅ DB-driven assignment fields
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

function clean(v?: string | null) {
  return (v ?? "").trim();
}

/** ✅ Your leads.status_id values shown in Supabase are like: new, contacted ... */
function statusToStatusId(s: LeadStatus): string {
  switch (s) {
    case "New":
      return "new";
    case "Contacted":
      return "contacted";
    case "Follow-Up":
      return "follow-up"; // if your DB uses "followup" instead, change here
    case "Booked":
      return "booked";
    case "Lost":
      return "lost";
    default:
      return "new";
  }
}

export async function listAgentsAction(): Promise<Ok<Agent[]> | Fail> {
  try {
    const supabase = await supabaseServer();

    // ✅ Agents live in public.profiles (role = agent)
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "agent")
      .order("created_at", { ascending: true });

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
      .select("id, name")
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

    const status = (payload.status ?? "New") as LeadStatus;

    // ✅ lead.full_name is NOT NULL in DB, so ensure something always exists
    const safeName =
      clean(payload.full_name) ||
      clean(payload.phone) ||
      clean(payload.email) ||
      "Unnamed lead";

    const insertRow: any = {
      full_name: safeName,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      source: payload.source ?? null,
      notes: payload.notes ?? null,

      // ✅ store both (your app uses status text right now)
      status,
      status_id: statusToStatusId(status),

      agent_id: payload.agent_id ?? null,
      brand_id: payload.brand_id ?? null,

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

    const { data, error } = await supabase.from("leads").insert(insertRow).select("*").single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Lead };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function moveLeadAction(args: { id: string; status: LeadStatus }): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("leads")
      .update({
        status: args.status,
        status_id: statusToStatusId(args.status),
      })
      .eq("id", args.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

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
