"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function createLeadAction(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  // basic
  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const source = String(formData.get("source") || "").trim() || "web";
  const priority = (String(formData.get("priority") || "warm") as
    | "hot"
    | "warm"
    | "cold") ?? "warm";

  // travel details
  const trip_type = String(formData.get("trip_type") || "return").trim(); // oneway/return/multicity
  const departure = String(formData.get("departure") || "").trim() || null;
  const destination = String(formData.get("destination") || "").trim() || null;

  const depart_date_raw = String(formData.get("depart_date") || "").trim();
  const return_date_raw = String(formData.get("return_date") || "").trim();
  const depart_date = depart_date_raw ? depart_date_raw : null; // YYYY-MM-DD
  const return_date = return_date_raw ? return_date_raw : null; // YYYY-MM-DD

  const adults = Number(formData.get("adults") || 1);
  const children = Number(formData.get("children") || 0);
  const infants = Number(formData.get("infants") || 0);

  const cabin_class = String(formData.get("cabin_class") || "economy").trim();
  const budget = String(formData.get("budget") || "").trim() || null;
  const preferred_airline =
    String(formData.get("preferred_airline") || "").trim() || null;

  const whatsapp = String(formData.get("whatsapp") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  const follow_up_date_raw = String(formData.get("follow_up_date") || "").trim();
  const follow_up_date = follow_up_date_raw ? follow_up_date_raw : null;

  // validations (minimum)
  if (!full_name) redirect("/leads?message=Full name is required");
  if (!departure) redirect("/leads?message=Departure is required");
  if (!destination) redirect("/leads?message=Destination is required");
  if (!depart_date) redirect("/leads?message=Depart date is required");
  if (adults < 1) redirect("/leads?message=Adults must be at least 1");

  // default status
  const status_id = "new";

  // next position in that column
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
    status_id,
    position: nextPos,
    created_by: auth.user.id,
    assigned_to: auth.user.id,
    last_activity_at: new Date().toISOString(),

    // new travel fields
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
    whatsapp,
    notes,
    follow_up_date,
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

  // 1) update moved lead
  const { error: updErr } = await supabase
    .from("leads")
    .update({
      status_id: toStatusId,
      position: toIndex,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (updErr) return { ok: false, message: updErr.message };

  // 2) normalize positions in destination column
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

  // 4) optional activity log (agar table hai)
  try {
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      type: "status_change",
      message: `Moved to ${toStatusId}`,
      created_by: auth.user.id,
    });
  } catch {}

  revalidatePath("/leads");
  return { ok: true };
}
