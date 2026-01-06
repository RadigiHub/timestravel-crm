"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FollowupLeadRow } from "../actions";
import { setFollowupAtAction, updateLeadStatusAction } from "../actions";
import type { LeadStatus } from "@/app/leads/actions";

function fmt(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString();
}

function tomorrowAt(hours = 10, minutes = 0) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

const STATUSES: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

export default function FollowupsClient({ initial }: { initial: FollowupLeadRow[] }) {
  const [rows, setRows] = useState<FollowupLeadRow[]>(initial ?? []);
  const [busyId, setBusyId] = useState<string | null>(null);

  const total = rows.length;

  const overdueCount = useMemo(() => {
    const now = Date.now();
    return rows.filter((r) => (r.follow_up_at ? new Date(r.follow_up_at).getTime() < now : false)).length;
  }, [rows]);

  async function snoozeTomorrow(id: string) {
    setBusyId(id);

    // optimistic: remove from list (because it won't be due anymore)
    setRows((prev) => prev.filter((r) => r.id !== id));

    const res = await setFollowupAtAction({ id, follow_up_at: tomorrowAt(10, 0) });
    if (!res.ok) alert(res.error);

    setBusyId(null);
  }

  async function setStatus(id: string, status: LeadStatus) {
    setBusyId(id);

    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

    const res = await updateLeadStatusAction({ id, status });
    if (!res.ok) alert(res.error);

    setBusyId(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold text-zinc-900">Follow-ups Due</div>
            <div className="text-sm text-zinc-600">Due today + overdue (Booked/Lost excluded)</div>
          </div>

          <div className="mt-3 flex items-center gap-2 md:mt-0">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700">
              Total: <span className="font-semibold">{total}</span>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700">
              Overdue: <span className="font-semibold">{overdueCount}</span>
            </div>

            <Link
              href="/leads"
              className="inline-flex rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Back to Board
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                <th className="py-2 pr-3">Lead</th>
                <th className="py-2 pr-3">Agent</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Follow-up At</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-100">
                    <td className="py-3 pr-3">
                      <div className="font-medium text-zinc-900">
                        <Link className="hover:underline" href={`/leads/${r.id}`}>
                          {(r.full_name ?? "").trim() || (r.phone ?? "").trim() || (r.email ?? "").trim() || "Unnamed lead"}
                        </Link>
                      </div>
                      <div className="text-xs text-zinc-600">
                        {[r.phone, r.email, r.notes].filter(Boolean).join(" • ").slice(0, 120)}
                      </div>
                    </td>

                    <td className="py-3 pr-3 text-zinc-700">{r.agent_name ?? "Unassigned"}</td>

                    <td className="py-3 pr-3">
                      <select
                        className="w-full max-w-[180px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                        value={r.status}
                        onChange={(e) => setStatus(r.id, e.target.value as LeadStatus)}
                        disabled={busyId === r.id}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 pr-3 text-zinc-700">{fmt(r.follow_up_at)}</td>
                    <td className="py-3 pr-3 text-zinc-700">{r.source ?? "—"}</td>

                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/leads/${r.id}`}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                        >
                          Open
                        </Link>

                        <button
                          type="button"
                          className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                          disabled={busyId === r.id}
                          onClick={() => snoozeTomorrow(r.id)}
                          title="Move follow-up to tomorrow 10:00"
                        >
                          Snooze to Tomorrow
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-zinc-600">
                    No follow-ups due 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          Next: yahan “WhatsApp click”, “Call click”, aur “Overdue by X days” badges add karenge.
        </div>
      </div>
    </div>
  );
}
