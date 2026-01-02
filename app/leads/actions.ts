"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

export type Agent = {
  id: string;
  name: string | null;
  email: string | null;
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

  // optional “detail fields” (safe even if DB me null hon)
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

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; error: string };

function clean(v?: string | null) {
  return (v ?? "").trim();
}

// ✅ Agents list (dropdown)
export async function listAgentsAction(): Promise<Ok<Agent[]> | Fail> {
  try {
    const sb = await supabaseServer();

    const { data, error } = await sb
      .from("agents")
      .select("id,name,email")
      .order("created_at", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as Agent[] };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to load agents" };
  }
}

// ✅ Create Lead (DETAIL form supported)
export type CreateLeadInput = {
  full_name: string;
  phone?: string;
  email?: string;
  source?: string;
  notes?: string;
  status?: LeadStatus;
  assigned_to?: string | null;
  follow_up_at?: string | null;

  // detail fields (optional)
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
};

export async function createLeadAction(input: CreateLeadInput): Promise<Ok<{ id: string }> | Fail> {
  try {
    const sb = await supabaseServer();

    const payload = {
      full_name: clean(input.full_name),
      phone: clean(input.phone),
      email: clean(input.email),
      source: clean(input.source) || null,
      notes: clean(input.notes) || null,
      status: (input.status ?? "New") as LeadStatus,
      assigned_to: input.assigned_to ?? null,
      follow_up_at: input.follow_up_at ?? null,

      // detail fields
      departure: clean(input.departure) || null,
      destination: clean(input.destination) || null,
      travel_date: input.travel_date ?? null,
      return_date: input.return_date ?? null,
      pax_adults: typeof input.pax_adults === "number" ? input.pax_adults : null,
      pax_children: typeof input.pax_children === "number" ? input.pax_children : null,
      pax_infants: typeof input.pax_infants === "number" ? input.pax_infants : null,
      budget: clean(input.budget) || null,
      airline: clean(input.airline) || null,
      cabin: clean(input.cabin) || null,
    };

    if (!payload.full_name) return { ok: false, error: "Full name is required." };

    const { data, error } = await sb
      .from("leads")
      .insert(payload)
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath("/dashboard");

    return { ok: true, data: { id: data.id as string } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to create lead" };
  }
}

// ✅ Move lead status (Kanban drag/drop)
export async function moveLeadAction(args: { id: string; status: LeadStatus }): Promise<Ok<true> | Fail> {
  try {
    const sb = await supabaseServer();

    const { error } = await sb
      .from("leads")
      .update({ status: args.status })
      .eq("id", args.id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { ok: true, data: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to move lead" };
  }
}

// ✅ Assign lead to agent
export async function assignLeadAction(args: { id: string; assigned_to: string | null }): Promise<Ok<true> | Fail> {
  try {
    const sb = await supabaseServer();

    const { error } = await sb
      .from("leads")
      .update({ assigned_to: args.assigned_to })
      .eq("id", args.id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { ok: true, data: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to assign lead" };
  }
}
