"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type FollowupLeadRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string | null;
  notes: string | null;
  follow_up_at: string | null;
  agent_id: string | null;
  brand_id: string | null;
  created_at: string | null;
};

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };
type Res<T> = Ok<T> | Err;

function safeError(e: unknown) {
  if (e instanceof Error) return e.message;
  return "Unknown error";
}

/**
 * Followups Due:
 * - follow_up_at not null
 * - follow_up_at <= now
 * - status not Booked/Lost
 */
export async function listFollowupsDueAction(): Promise<
  Res<{ total: number; overdue: number; items: FollowupLeadRow[] }>
> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Not authenticated" };

    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("leads")
      .select(
        "id, full_name, phone, email, source, status, notes, follow_up_at, agent_id, brand_id, created_at"
      )
      .not("follow_up_at", "is", null)
      .lte("follow_up_at", nowIso)
      .not("status", "in", '("Booked","Lost")')
      .order("follow_up_at", { ascending: true });

    if (error) return { ok: false, error: error.message };

    const items = (data ?? []) as FollowupLeadRow[];
    const now = Date.now();
    const overdue = items.filter((x) => {
      const t = x.follow_up_at ? new Date(x.follow_up_at).getTime() : 0;
      return t && t < now;
    }).length;

    return { ok: true, data: { total: items.length, overdue, items } };
  } catch (e) {
    return { ok: false, error: safeError(e) };
  }
}

/**
 * ✅ BACKWARD COMPAT EXPORT (your FollowupsClient expects this)
 * Sets follow_up_at to an ISO string or null.
 */
export async function setFollowupAtAction(leadId: string, isoOrNull: string | null): Promise<Res<true>> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase.from("leads").update({ follow_up_at: isoOrNull }).eq("id", leadId);
    if (error) return { ok: false, error: error.message };

    // best-effort timeline log (ignore if schema differs)
    try {
      await supabase.from("lead_activities").insert([
        {
          lead_id: leadId,
          type: "followup",
          message: isoOrNull ? `Follow-up set to ${isoOrNull}` : "Follow-up cleared",
        },
      ]);
    } catch {}

    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: safeError(e) };
  }
}

/**
 * ✅ BACKWARD COMPAT EXPORT (your FollowupsClient expects this)
 */
export async function updateLeadStatusAction(leadId: string, status: string): Promise<Res<true>> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);
    if (error) return { ok: false, error: error.message };

    // best-effort timeline log
    try {
      await supabase.from("lead_activities").insert([
        { lead_id: leadId, type: "status", message: `Status set to ${status}` },
      ]);
    } catch {}

    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: safeError(e) };
  }
}
