"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

export type Agent = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at?: string | null;
};

export type Lead = {
  id: string;

  full_name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  notes: string | null;

  status: LeadStatus;
  assigned_to: string | null;
  follow_up_at: string | null;
  created_at: string;

  // Detailed lead form fields
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

function fail(error: unknown): Fail {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

export async function listAgentsAction(): Promise<Ok<Agent[]> | Fail> {
  try {
    const supabase = await supabaseServer();

    // NOTE: agar tumhare agents table me `name` column hai aur `full_name` nahi,
    // to select me name bhi le aao aur neeche map me set kar do.
    const { data, error } = await supabase
      .from("agents")
      .select("id,full_name,email,created_at,name")
      .order("created_at", { ascending: true });

    if (error) return fail(error);

    const rows: any[] = data ?? [];
    const cleaned: Agent[] = rows.map((a) => ({
      id: a.id,
      full_name: (a.full_name ?? a.name ?? null) as string | null,
      email: (a.email ?? null) as string | null,
      created_at: (a.created_at ?? null) as string | null,
    }));

    return { ok: true, data: cleaned };
  } catch (e) {
    return fail(e);
  }
}

export async function createLeadAction(payload: Partial<Lead>): Promise<Ok<Lead> | Fail> {
  try {
    const supabase = await supabaseServer();

    const insertPayload: any = {
      full_name: payload.full_name ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      source: payload.source ?? null,
      notes: payload.notes ?? null,

      status: (payload.status ?? "New") as LeadStatus,
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

    const { data, error } = await supabase.from("leads").insert(insertPayload).select("*").single();

    if (error) return fail(error);

    revalidatePath("/leads");
    return { ok: true, data: data as Lead };
  } catch (e) {
    return fail(e);
  }
}

export async function moveLeadAction(input: { id: string; status: LeadStatus }): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase.from("leads").update({ status: input.status }).eq("id", input.id);
    if (error) return fail(error);

    revalidatePath("/leads");
    return { ok: true, data: true };
  } catch (e) {
    return fail(e);
  }
}

export async function assignLeadAction(input: { id: string; assigned_to: string | null }): Promise<Ok<true> | Fail> {
  try {
    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("leads")
      .update({ assigned_to: input.assigned_to })
      .eq("id", input.id);

    if (error) return fail(error);

    revalidatePath("/leads");
    return { ok: true, data: true };
  } catch (e) {
    return fail(e);
  }
}
