"use server";

import { supabaseServer } from "@/lib/supabase/server";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };
type Res<T> = Ok<T> | Err;

function safeError(e: unknown) {
  if (e instanceof Error) return e.message;
  return "Unknown error";
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * List followups due: due today + overdue.
 * Excludes Booked/Lost.
 */
export async function listFollowupsDueAction(): Promise<
  Res<{
    total: number;
    overdue: number;
    items: any[];
  }>
> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Not authenticated" };

    const now = new Date();
    const nowIso = now.toISOString();

    // follow_up_at <= now AND not booked/lost AND follow_up_at is not null
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

    const items = data ?? [];
    const overdue = items.filter((x: any) => {
      const t = x?.follow_up_at ? new Date(x.follow_up_at).getTime() : 0;
      return t && t < now.getTime();
    }).length;

    return {
      ok: true,
      data: { total: items.length, overdue, items },
    };
  } catch (e) {
    return { ok: false, error: safeError(e) };
  }
}

/**
 * Snooze follow-up by +1 day (keeps same time).
 * Also (best-effort) logs timeline in lead_activities if table exists.
 */
export async function snoozeFollowupTomorrowAction(leadId: string): Promise<Res<true>> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Not authenticated" };

    // get current follow_up_at
    const { data: row, error: readErr } = await supabase
      .from("leads")
      .select("id, follow_up_at")
      .eq("id", leadId)
      .single();

    if (readErr) return { ok: false, error: readErr.message };

    const current = row?.follow_up_at ? new Date(row.follow_up_at) : new Date();
    const next = addDays(current, 1);

    const { error: upErr } = await supabase
      .from("leads")
      .update({ follow_up_at: next.toISOString() })
      .eq("id", leadId);

    if (upErr) return { ok: false, error: upErr.message };

    // Best-effort timeline log (won't break if schema differs)
    try {
      await supabase.from("lead_activities").insert([
        {
          lead_id: leadId,
          type: "followup",
          message: `Follow-up snoozed to ${next.toISOString()}`,
        },
      ]);
    } catch {
      // ignore logging failures
    }

    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: safeError(e) };
  }
}

/**
 * Quick status update from Follow-ups table (optional but handy).
 */
export async function setLeadStatusAction(leadId: string, status: string): Promise<Res<true>> {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);
    if (error) return { ok: false, error: error.message };

    // Best-effort timeline log
    try {
      await supabase.from("lead_activities").insert([
        { lead_id: leadId, type: "status", message: `Status set to ${status}` },
      ]);
    } catch {
      // ignore
    }

    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: safeError(e) };
  }
}
