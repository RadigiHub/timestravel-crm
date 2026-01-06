export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getDashboardDataAction } from "./actions";

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  const res = await getDashboardDataAction();
  if (!res.ok) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="text-lg font-semibold text-zinc-900">Dashboard Error</div>
          <div className="mt-2 text-sm text-zinc-600">{res.error}</div>
        </div>
      </div>
    );
  }

  const { kpis, pipeline, agents } = res.data;

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <div className="text-2xl font-bold text-zinc-900">Dashboard</div>
        <div className="mt-1 text-sm text-zinc-600">Live KPIs — aaj ki performance aur pipeline overview.</div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Total Leads</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{kpis.total_leads}</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Today New</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{kpis.today_new}</div>
          <div className="mt-1 text-xs text-zinc-500">Created today</div>
        </div>

        {/* ✅ Clickable Follow-ups Due card */}
        <Link href="/followups" className="block">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:bg-zinc-50">
            <div className="text-xs text-zinc-500">Follow-ups Due</div>
            <div className="mt-1 text-2xl font-semibold text-zinc-900">{kpis.followups_due}</div>
            <div className="mt-1 text-xs text-zinc-500">Due today / overdue</div>
          </div>
        </Link>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Booked</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{kpis.booked}</div>
          <div className="mt-1 text-xs text-zinc-500">Total booked</div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-zinc-900">Pipeline Status</div>
        <div className="mt-1 text-sm text-zinc-600">New → Contacted → Follow-Up → Booked/Lost</div>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {(["New", "Contacted", "Follow-Up", "Booked", "Lost"] as const).map((s) => (
            <div key={s} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-xs text-zinc-500">{s}</div>
              <div className="mt-1 text-xl font-semibold text-zinc-900">{pipeline[s]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Leaderboard */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-zinc-900">Agent Leaderboard</div>
        <div className="mt-1 text-sm text-zinc-600">Booked priority, then total workload</div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                <th className="py-2 pr-4">Agent</th>
                <th className="py-2 pr-4">Total Leads</th>
                <th className="py-2 pr-4">Booked</th>
                <th className="py-2 pr-4">New Today</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.agent_id} className="border-b border-zinc-100">
                  <td className="py-2 pr-4 font-medium text-zinc-900">{a.agent_name}</td>
                  <td className="py-2 pr-4">{a.total_leads}</td>
                  <td className="py-2 pr-4">{a.booked}</td>
                  <td className="py-2 pr-4">{a.new_today}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          Next: conversion %, avg time to contact, aur “follow-up overdue list”.
        </div>
      </div>
    </div>
  );
}
