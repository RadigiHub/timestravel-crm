"use server";

import { createClient } from "@/lib/supabase/server";
import type { Lead, Agent } from "./types";

export async function listAgentsAction() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "agent");

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, agents: data as Agent[] };
}

export async function assignLeadAction(leadId: string, agentId: string | null) {
  const supabase = createClient();

  const { error } = await supabase
    .from("leads")
    .update({
      assigned_to: agentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
