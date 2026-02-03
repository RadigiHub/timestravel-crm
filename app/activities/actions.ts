"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type ActivityType =
  | "lead_opened"
  | "whatsapp_clicked"
  | "call_clicked"
  | "followup_snoozed"
  | "followup_done"
  | "status_changed";

export async function logActivityAction(params: {
  leadId: string;
  type: ActivityType;
  message?: string | null;
}) {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();

    const { error } = await supabase.from("lead_activities").insert({
      lead_id: params.leadId,
      type: params.type,
      message: params.message ?? null,
      created_by: auth?.user?.id ?? null,
    });

    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? "Unknown error" };
  }
}
