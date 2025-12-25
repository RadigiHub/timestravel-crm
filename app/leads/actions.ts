"use server";

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
  priority: "hot" | "warm" | "cold";
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateLeadInput = {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  priority?: "hot" | "warm" | "cold";
  status_id: string;
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

export async function createLeadAction(input: CreateLeadInput): Promise<CreateLeadResult> {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { ok: false, error: "Unauthorized" };

  const full_name = (input.full_name ?? "").trim();
  if (!full_name) return { ok: false, error: "Full name is required." };
  if (!input.status_id) return { ok: false, error: "status_id is required." };

  const insertRow = {
    full_name,
    phone: input.phone ?? null,
    email: input.email ?? null,
    source: input.source ?? null,
    priority: input.priority ?? "warm",
    status_id: input.status_id,
    // put on top by default
    position: 0,
  };

  const { data: created, error: cErr } = await supabase
    .from("leads")
    .insert(insertRow)
    .select("*")
    .single();

  if (cErr || !created) {
    return { ok: false, error: cErr?.message ?? "Failed to create lead." };
  }

  // OPTIONAL: re-normalize positions inside this status so duplicates na banain
  // (safe + simple)
  const { data: sameStatus } = await supabase
    .from("leads")
    .select("id")
    .eq("status_id", insertRow.status_id)
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (sameStatus && sameStatus.length) {
    // new lead ko top pe rakh do
    const ids = [
      created.id,
      ...sameStatus.map((r: any) => r.id).filter((id: string) => id !== created.id),
    ];

    // update positions in small batches
    for (let i = 0; i < ids.length; i++) {
      await supabase.from("leads").update({ position: i }).eq("id", ids[i]);
    }
  }

  return { ok: true, lead: created as Lead };
}

export async function moveLeadAction(input: MoveLeadInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { ok: false, error: "Unauthorized" };

  const { fromStatusId, toStatusId, fromOrderIds, toOrderIds } = input;

  // update "from" column positions
  for (let i = 0; i < fromOrderIds.length; i++) {
    const id = fromOrderIds[i];
    await supabase.from("leads").update({ status_id: fromStatusId, position: i }).eq("id", id);
  }

  // update "to" column positions (and status_id)
  for (let i = 0; i < toOrderIds.length; i++) {
    const id = toOrderIds[i];
    await supabase.from("leads").update({ status_id: toStatusId, position: i }).eq("id", id);
  }

  return { ok: true };
}
