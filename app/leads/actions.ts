"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

type TripType = "oneway" | "return" | "multicity";
type Priority = "hot" | "warm" | "cold";
type CabinClass = "economy" | "premium" | "business" | "first";

function toInt(v: FormDataEntryValue | null, fallback: number) {
  const n = Number(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

export async function createLeadAction(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  // Basic
  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const source = String(formData.get("source") || "").trim() || "web";

  // Travel details
  const trip_type = (String(formData.get("trip_type") || "return") as TripType) ?? "return";
  const departure = String(formData.get("departure") || "").trim();
  const destination = String(formData.get("destination") || "").trim();
  const depart_date = String(formData.get("depart_date") || "").trim();
  const return_date_raw = String(formData.get("return_date") || "").trim();
  const return_date = return_date_raw ? return_date_raw : null;

  const adults = toInt(formData.get("adults"), 1);
  const children = toInt(formData.get("children"), 0);
  const infants = toInt(formData.get("infants"), 0);

  const cabin_class = (String(formData.get("cabin_class") || "economy") as CabinClass) ?? "economy";
  const priority = (String(formData.get("priority") || "warm") as Priority) ?? "warm";

  const preferred_airline = String(formData.get("preferred_airline") || "").trim() || null;
  const budget = String(formData.get("budget") || "").trim() || null;

  // IMPORTANT: tumhari DB column ka naam "whatsapp_text" hai (SQL me ye add hua)
  const whatsapp_text = String(formData.get("whatsapp") || "").trim() || null;

  const follow_up_date_raw = String(formData.get("follow_up_date") || "").trim();
  const follow_up_date = follow_up_date_raw ? follow_up_date_raw : null;

  const notes = String(formData.get("notes") || "").trim() || null;

  // Validation
  if (!full_name) redirect("/leads?message=Full name is required");
  if (!departure) redirect("/leads?message=Departure is required");
  if (!destination) redirect("/leads?message=Destination is required");
  if (!depart_date) redirect("/leads?message=Depart date is required");
  if (trip_type === "return" && !return_date) redirect("/leads?message=Return date is required");
  if (adults < 1) redirect("/leads?message=Adults must be at least 1");

  // default status: "new"
  const status_id = "new";

  // find next position in that column
  const { data: last } = await supabase
    .from("leads")
    .select("position")
    .eq("status_id", status_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPos = (last?.position ?? -1) + 1;

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
    budget,
    preferred_airline,
    whatsapp_text,
    notes,
    follow_up_date,

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

export async function moveLeadAction(payload: {
  leadId: string;
  toStatusId: string;
  toIndex: number;
}) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { ok: false, message: "Not logged in" };

  const { leadId, toStatusId, toIndex } = payload;

  // 1) update the moved lead first
  const { error: updErr } = await supabase
    .from("leads")
    .update({
      status_id: toStatusId,
      position: toIndex,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (updErr) return { ok: false, message: updErr.message };

  // 2) normalize positions for destination column (0..n)
  const { data: colLeads, error: colErr } = await supabase
    .from("leads")
    .select("id, position, updated_at")
    .eq("status_id", toStatusId)
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (colErr) return { ok: false, message: colErr.message };

  const ids = (colLeads ?? []).map((x) => x.id);

  // 3) rewrite positions
  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabase.from("leads").update({ position: i }).eq("id", ids[i]);
    if (error) return { ok: false, message: error.message };
  }

  // 4) activity log
  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    type: "status_change",
    message: `Moved to ${toStatusId}`,
    created_by: auth.user.id,
  });

  revalidatePath("/leads");
  return { ok: true };
}
