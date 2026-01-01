"use server";

import { revalidatePath } from "next/cache";
// IMPORTANT: yahan apna existing supabase server client import rakho.
// Tumhare project me jo helper already hai, wohi path use karo.
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

export type Agent = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; error: string };

export async function listAgentsAction(): Promise<Ok<Agent[]> | Fail> {
  try {
    const supabase = await createSupabaseServerClient();

    // Agents table/fields agar different hain to yahan adjust karna hoga
    const { data, error } = await supabase
      .from("agents")
      .select("id,name,full_name,email")
      .order("created_at", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as Agent[] };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}

// ✅ Alias so AddLeadForm ka import kabhi na toote
export async function getAgentsAction() {
  return listAgentsAction();
}

export type CreateLeadInput = {
  // DB type ke mutabiq: "name" field use ho raha hai (NOT full_name)
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status?: LeadStatus;
  assigned_to?: string | null;
};

export async function createLeadAction(input: CreateLeadInput): Promise<Ok<{ id: string }> | Fail> {
  try {
    const supabase = await createSupabaseServerClient();

    const payload = {
      name: input.name?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
      status: input.status ?? "New",
      assigned_to: input.assigned_to ?? null,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/leads");
    revalidatePath("/dashboard");

    return { ok: true, data: { id: data.id as string } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
