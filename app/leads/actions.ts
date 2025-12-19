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

/* ================= CREATE LEAD ================= */

export async function createLeadAction(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) redirect("/login");

  /* ---------- Basic ---------- */
  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const source = String(formData.get("source") || "web");

  /* ---------- Travel ---------- */
  const trip_type = (String(formData.get("trip_type") || "return") as TripType);
  const departure = String(formData.get("departure") || "").trim();
  const destination = String(formData.get("destination") || "").trim();
  const depart_date = String(formData.get("depart_date") || "").trim();

  const return_date_raw = String(formData.get("return_date") || "").trim();
  const return_date = return_date_raw ? return_date_raw : null;

  const adults = toInt(formData.get("adults"), 1);
  const children = toInt(formData.get("children"), 0);
  const infants = toInt(formData.get("infants"), 0);

  const cabin_class = (String(
    formData.get("cabin_class") || "economy"
  ) as CabinClass);

  const priority = (String(formData.get("priority") || "warm") as Priority);

  const preferred_airline =
    String(formData.get("preferred_airline") || "").trim() || null;

  const budget = String(formData.get("budget") || "").trim() || null;

  const whatsapp_text =
    String(formData.get("whatsapp") || "").trim() || null;

  const follow_up_date_raw =
    String(formData.get("follow_up_date") || "").trim();
  const follow_up_date = follow_up_date_raw ? follow_up_date_raw : null;

  const notes = String(formData.get("notes") || "").trim() || null;

  /* ---------- Validation ---------- */
  if (!full_name) redirect("/leads?message=Full name is required");
  if (!departure) redirect("/leads?message=Departure is required");
  if (!destination) redirect("/leads?message=Destination is required");
  if (!depart_date) redirect("/leads?message=Depart date is required");
  if (trip_type === "return" && !return_date)
    redirect("/leads?message=Return date is required");
  if (adults < 1) redirect("/leads?message=Adults must be at least 1");

  /* ---------- Status & Position ---------- */
  const status_id = "new";

  const { data: last } = await supabase
    .from("leads")
    .select("position")
    .eq("status_id", status_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPos = (last?.position ?? -1) + 1;

  /* ---------- Insert ---------- */
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
    redirect(`/leads?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/leads");
}

/* ================= MOVE LEAD (DRAG & DROP) ================= */

export async function moveLeadAction(input: {
  fromStatusId: string;
  toStatusId: string;
  fromOrderIds: string[];
  toOrderIds: string[];
}) {
  const supabase = await supabaseServer();

  /* ---- FROM column reorder ---- */
  for (let i = 0; i < input.fromOrderIds.length; i++) {
    const id = input.fromOrderIds[i];
    const { error } = await supabase
      .from("leads")
      .update({
        status_id: input.fromStatusId,
        position: i,
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  /* ---- TO column reorder ---- */
  for (let i = 0; i < input.toOrderIds.length; i++) {
    const id = input.toOrderIds[i];
    const { error } = await supabase
      .from("leads")
      .update({
        status_id: input.toStatusId,
        position: i,
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  revalidatePath("/leads");
  return { ok: true };
}
