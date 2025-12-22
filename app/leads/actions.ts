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

async function ensureProfileExists() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) return null;

  // ✅ profiles table me row missing ho to create/update kar do
  // NOTE: tumhare profiles columns different ho sakte hain, lekin id + email almost always hotay hain.
  await supabase.from("profiles").upsert(
    {
      id: auth.user.id,
      email: auth.user.email ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  return auth.user;
}

/* ================= CREATE LEAD ================= */
/**
 * IMPORTANT:
 * - form action ko server action assign karte waqt return type Promise<void> hona chahiye
 * - is liye yahan koi object return nahi kar rahe
 */
export async function createLeadAction(formData: FormData): Promise<void> {
  const user = await ensureProfileExists();
  if (!user) redirect("/login");

  const supabase = await supabaseServer();

  /* ---------- Basic ---------- */
  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const source = String(formData.get("source") || "web").trim();

  /* ---------- Travel ---------- */
  const trip_type = String(formData.get("trip_type") || "return") as TripType;
  const departure = String(formData.get("departure") || "").trim();
  const destination = String(formData.get("destination") || "").trim();
  const depart_date = String(formData.get("depart_date") || "").trim();

  const return_date_raw = String(formData.get("return_date") || "").trim();
  const return_date = return_date_raw ? return_date_raw : null;

  const adults = toInt(formData.get("adults"), 1);
  const children = toInt(formData.get("children"), 0);
  const infants = toInt(formData.get("infants"), 0);

  const cabin_class = String(formData.get("cabin_class") || "economy") as CabinClass;
  const priority = String(formData.get("priority") || "warm") as Priority;

  const preferred_airline = String(formData.get("preferred_airline") || "").trim() || null;
  const budget = String(formData.get("budget") || "").trim() || null;

  // ✅ DB column name: whatsapp_text
  const whatsapp_text = String(formData.get("whatsapp") || "").trim() || null;

  const follow_up_date_raw = String(formData.get("follow_up_date") || "").trim();
  const follow_up_date = follow_up_date_raw ? follow_up_date_raw : null;

  const notes = String(formData.get("notes") || "").trim() || null;

  /* ---------- Validation ---------- */
  if (!full_name) redirect("/leads?message=Full name is required");
  if (!departure) redirect("/leads?message=Departure is required");
  if (!destination) redirect("/leads?message=Destination is required");
  if (!depart_date) redirect("/leads?message=Depart date is required");
  if (trip_type === "return" && !return_date) redirect("/leads?message=Return date is required");
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

    created_by: user.id,
    assigned_to: user.id, // ✅ ab FK pass ho jayegi because profiles row ensured
    last_activity_at: new Date().toISOString(),
  });

  if (error) {
    // ✅ exact error show
    redirect(`/leads?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/leads");
  // optional (agar board reload nahi ho raha): redirect("/leads");
}

/* ================= MOVE LEAD (DRAG & DROP) ================= */

export async function moveLeadAction(input: {
  fromStatusId: string;
  toStatusId: string;
  fromOrderIds: string[];
  toOrderIds: string[];
}) {
  const user = await ensureProfileExists();
  if (!user) return { ok: false, message: "Not logged in" };

  const supabase = await supabaseServer();

  /* ---- FROM column reorder ---- */
  for (let i = 0; i < input.fromOrderIds.length; i++) {
    const id = input.fromOrderIds[i];
    const { error } = await supabase
      .from("leads")
      .update({
        status_id: input.fromStatusId,
        position: i,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, message: error.message };
  }

  /* ---- TO column reorder ---- */
  for (let i = 0; i < input.toOrderIds.length; i++) {
    const id = input.toOrderIds[i];
    const { error } = await supabase
      .from("leads")
      .update({
        status_id: input.toStatusId,
        position: i,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/leads");
  return { ok: true };
}
