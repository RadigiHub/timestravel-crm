"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function createLeadAction(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const source = String(formData.get("source") || "").trim() || "web";
  const priority = (String(formData.get("priority") || "warm") as
    | "hot"
    | "warm"
    | "cold") ?? "warm";

  if (!full_name) redirect("/leads?message=Full name is required");

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

  // Make sure the moved item ends exactly at toIndex
  const ids = (colLeads ?? []).map((x) => x.id);

  // 3) rewrite positions
  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabase
      .from("leads")
      .update({ position: i })
      .eq("id", ids[i]);
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
