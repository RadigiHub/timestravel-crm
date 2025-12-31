"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type DashboardData = {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  followUp: number;
  booked: number;
  lost: number;
};

export async function getDashboardDataAction(): Promise<DashboardData> {
  const supabase = await supabaseServer();

  // NOTE: table name "leads" assumed. Agar tumhari table ka naam different ho, yahan update karna.
  const { data, error } = await supabase
    .from("leads")
    .select("status", { count: "exact", head: false });

  if (error) throw new Error(error.message);

  const counts = {
    totalLeads: 0,
    newLeads: 0,
    contacted: 0,
    followUp: 0,
    booked: 0,
    lost: 0,
  };

  (data ?? []).forEach((row: any) => {
    counts.totalLeads += 1;

    const s = String(row.status || "").toLowerCase();
    if (s === "new") counts.newLeads += 1;
    else if (s === "contacted") counts.contacted += 1;
    else if (s === "follow-up" || s === "followup" || s === "follow_up") counts.followUp += 1;
    else if (s === "booked") counts.booked += 1;
    else if (s === "lost") counts.lost += 1;
  });

  return counts;
}
