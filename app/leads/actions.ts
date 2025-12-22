"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/* ================= TYPES ================= */

type TripType = "oneway" | "return" | "multicity";
type Priority = "hot" | "warm" | "cold";
type CabinClass = "economy" | "premium" | "business" | "first";

/* ================= HELPERS ================= */

function toInt(v: FormDataEntryValue | null, fallback: number) {
  const n = Number(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

function str(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

/* ================= CREATE LEAD ================= */
/**
 * IMPORTANT for <form action={createLeadAction}>:
 * This MUST return void / Promise<void> (no object return)
 */
export async function createLeadAction(formData: FormData): Promise<void> {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  /* ---------- Basic ---------- */
  const full_name = str(formData.get("full_name"));
  const phone = str(formData.get("phone")) || null;
  const email = str(formData.get("email")) || null;
  const source = str(formData.get("source")) || "web";

  /* ---------- Travel ---------- */
  const trip_type = (str(formData.get("trip_type")) || "return") as TripType;
  const departure = str(formData.get("departure"));
  const destination = str(formData.get("destination"));
  const depart_date = str(formData.get("depart_date"));

  const return_date_raw = str(formData.get("return_date"));
  const return_date = return_date_raw ? return_date_raw : null;

  const adults = toInt(formData.get("adults"), 1);
  const children = toInt(formData.get("children"), 0);
  const infants = toInt(formData.get("infants"), 0);

  const cabin_class = (str(formData.get("cabin_class")) || "economy") as CabinClass;
  const priority = (str(formData.get("priority")) || "warm") as Priority;

  const preferred_airline = str(formData.get("preferred_airline")) || null;
  const budget = str(formData.get("budget")) || null;

  // DB column name: whatsapp_text
  const whatsapp_text = str(formData.get("whatsapp")) || null;

  const follow_up_date_raw = str(formData.get("follow_up_date"));
  const follow_up_date = follow_up_date_raw ? follow_up_date_raw : null;

  const notes = str(formData.get("notes")) || null;

  /* ---------- Validation ---------- */
  if (!full_name) redirect("/leads?message=" + encodeURIComponent("Full name is required"));
  if (!departure) redirect("/leads?message=" + encodeURIComponent("Departure is required"));
  if (!destination) redirect("/leads?message=" + encodeURIComponent("Destination is required"));
  if (!depart_date) redirect("/leads?message=" + encodeURIComponent("Depart date is required"));
  if (trip_type === "return" && !return_date)
    redirect("/leads?message=" + encodeURIComponent("Return date is required"));
  if (adults < 1) redirect("/leads?message=" + encodeURIComponent("Adults must be at least 1"));

  /* ---------- CRITICAL FIX (FK) ----------
   * leads.assigned_to likely references public.profiles(id)
   * so ensure the profile row exists for this auth.user.id
   */
  const { error: profErr } = await supabase
    .from("profiles")
    .upsert(
      { id: auth.user.id, full_name: full_name || null },
      { onConflict: "id" }
    );

  if (profErr) {
    redirect("/leads?message=" + encodeURIComponent(`Profile create error: ${profErr.message}`));
  }

  /* ---------- Status & Position ---------- */
  const status_id = "new";

  const { data: last, error: lastErr } = await supabase
    .from("leads")
    .select("position")
    .eq("status_id", status_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) {
    redirect("/leads?message=" + encodeURIComponent(`Position check error: ${lastErr.message}`));
  }

  const nextPos = (last?.position ?? -1) + 1;

  /* ---------- Insert Lead ---------- */
  const { error } = await supabase.from("leads").insert({
    full_name,
    phone,
    email,
    source,
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
    assigned_to: auth.user.id,
    last_activity_at: new Date().toISOString(),
  });

  if (error) {
    redirect("/leads?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/leads");
  redirect("/leads");
}

/* ================= MOVE LEAD (DRAG & DROP) ================= */

export async function moveLeadAction(input: {
  fromStatusId: string;
  toStatusId: string;
  fromOrderIds: string[];
  toOrderIds: string[];
}) {
  const supabase = await supabaseServer();

  // FROM column positions
  for (let i = 0; i < input.fromOrderIds.length; i++) {
    const id = input.fromOrderIds[i];
    const { error } = await supabase
      .from("leads")
      .update({ status_id: input.fromStatusId, position: i })
      .eq("id", id);

    if (error) return { ok: false, message: error.message };
  }

  // TO column positions
  for (let i = 0; i < input.toOrderIds.length; i++) {
    const id = input.toOrderIds[i];
    const { error } = await supabase
      .from("leads")
      .update({ status_id: input.toStatusId, position: i })
      .eq("id", id);

    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/leads");
  return { ok: true };
}
