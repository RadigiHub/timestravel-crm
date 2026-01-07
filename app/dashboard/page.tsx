export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getDashboardDataAction } from "./actions";

function CardLink({
  href,
  title,
  value,
  subtitle,
}: {
  href: string;
  title: string;
  value: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-zinc-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{value}</div>
          {subtitle ? <div className="mt-1 text-xs text-zinc-500">{subtitle}</div> : null}
        </div>

        <div className="mt-1 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 group-hover:bg-zinc-100">
          View
        </div>
      </div>
    </Link>
  );
}

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
  const followupsCount = Number(kpis.followups_due ?? 0);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-2xl font-bold text-zinc-900">Dashboard</div>
          <div className="mt-1 text-sm text-zinc-600">
            Live KPIs — aaj ki performance aur pipeline overview.
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/leads/new"
            className="inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            + Add Lead
          </Link>

          <Link
            href="/leads"
            className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Leads Board
          </Link>

          <Link
            href="/followups"
            className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Follow-ups
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <CardLink href="/leads" title="Total Leads" value={kpis.total_leads} subtitle="All time" />
        <CardLink href="/leads" title="Today New" value={kpis.today_new} subtitle="Created today" />
        <CardLink
          href="/followups"
          title="Follow-ups Due"
          value={kpis.followups_due}
          subtitle="Due today / overdue"
        />
        <CardLink href="/leads" title="Booked" value={kpis.booked} subtitle="Total booked" />
      </div>

      {/* Follow-ups CTA */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-base font-semibold text-zinc-900">Today’s Follow-ups</div>
            <div className="mt-1 text-sm text-zinc-600">
              Jo follow-ups due hain, unko pehle clear karo — pipeline fast move hogi.
            </div>
          </div>

          <Link
            href="/followups"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Open Follow-ups ({followupsCount})
          </Link>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm text-zinc-700">
            {followupsCount > 0 ? (
              <>
                You have <span className="font-semibold">{followupsCount}</span> follow-up(s) due.
                Open the list and clear them.
              </>
            ) : (
              <>No follow-ups due right now. ✅</>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-zinc-900">Pipeline Status</div>
            <div className="mt-1 text-sm text-zinc-600">New → Contacted → Follow-Up → Booked/Lost</div>
          </div>

          <Link
            href="/leads"
            className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Open Leads Board
          </Link>
        </div>

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
          Next: conversion %, avg time to contact, aur follow-up overdue highlight.
        </div>
      </div>
    </div>
  );
}
