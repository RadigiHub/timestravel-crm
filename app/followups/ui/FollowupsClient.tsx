"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FollowupLeadRow } from "../actions";
import { setFollowupAtAction, updateLeadStatusAction } from "../actions";

function fmt(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString();
}

function onlyDigitsPhone(p: string) {
  return (p || "").replace(/[^\d]/g, "");
}

function overdueDays(dt: string | null) {
  if (!dt) return 0;
  const t = new Date(dt).getTime();
  const now = Date.now();
  if (t >= now) return 0;
  const diff = now - t;
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function addDaysKeepTime(iso: string | null, days: number) {
  const base = iso ? new Date(iso) : new Date();
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function FollowupsClient({ initial }: { initial: { items: FollowupLeadRow[]; total: number; overdue: number } }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const items = initial?.items ?? [];
  const total = initial?.total ?? 0;
  const overdue = initial?.overdue ?? 0;

  const statusOptions = useMemo(() => ["New", "Contacted", "Follow-Up", "Booked", "Lost"], []);

  const onOpen = (id: string) => {
    router.push(`/leads/${id}`);
  };

  const onSnoozeTomorrow = async (lead: FollowupLeadRow) => {
    setErr(null);
    setBusyId(lead.id);
    const nextIso = addDaysKeepTime(lead.follow_up_at, 1);
    const res = await setFollowupAtAction(lead.id, nextIso);
    setBusyId(null);
    if (!res.ok) return setErr(res.error);
    router.refresh();
  };

  const onDoneClear = async (lead: FollowupLeadRow) => {
    setErr(null);
    setBusyId(lead.id);

    // clear followup
    const r1 = await setFollowupAtAction(lead.id, null);
    if (!r1.ok) {
      setBusyId(null);
      return setErr(r1.error);
    }

    // optional: keep status as Contacted if currently New
    const nextStatus = lead.status === "New" ? "Contacted" : lead.status ?? "Contacted";
    const r2 = await updateLeadStatusAction(lead.id, nextStatus);
    setBusyId(null);

    if (!r2.ok) return setErr(r2.error);
    router.refresh();
  };

  const onStatusChange = async (leadId: string, status: string) => {
    setErr(null);
    setBusyId(leadId);
    const res = await updateLeadStatusAction(leadId, status);
    setBusyId(null);
    if (!res.ok) return setErr(res.error);
    router.refresh();
  };

  const waLink = (lead: FollowupLeadRow) => {
    const digits = onlyDigitsPhone(lead.phone || "");
    if (!digits) return null;
    const msg = encodeURIComponent(
      `Assalam o Alaikum ${lead.full_name ?? ""}! Times Travel se follow-up kar rahe hain. Aapki query ka update share kar dein?`
    );
    return `https://wa.me/${digits}?text=${msg}`;
  };

  const callLink = (lead: FollowupLeadRow) => {
    const digits = onlyDigitsPhone(lead.phone || "");
    if (!digits) return null;
    return `tel:${digits}`;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">Follow-ups Due</div>
            <div className="mt-1 text-sm text-zinc-600">Due today + overdue (Booked/Lost excluded)</div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700">
              Total: <span className="font-semibold text-zinc-900">{total}</span>
            </div>
            <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700">
              Overdue: <span className="font-semibold text-zinc-900">{overdue}</span>
            </div>
            <a
              href="/leads"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Back to Board
            </a>
          </div>
        </div>

        {err ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                <th className="py-2 pr-4">Lead</th>
                <th className="py-2 pr-4">Agent</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Follow-up At</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="py-6 text-center text-zinc-500" colSpan={6}>
                    No follow-ups due 🎉
                  </td>
                </tr>
              ) : (
                items.map((lead) => {
                  const isBusy = busyId === lead.id;
                  const od = overdueDays(lead.follow_up_at);

                  const wa = waLink(lead);
                  const call = callLink(lead);

                  return (
                    <tr key={lead.id} className="border-b border-zinc-100 align-top">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-zinc-900">{lead.full_name ?? "—"}</div>
                        <div className="text-xs text-zinc-600">
                          {lead.phone ?? "—"} • {lead.email ?? "—"}
                        </div>
                        {lead.notes ? <div className="mt-1 text-xs text-zinc-500 line-clamp-1">{lead.notes}</div> : null}
                      </td>

                      <td className="py-3 pr-4">
                        <div className="text-sm text-zinc-900">{lead.agent_id ?? "—"}</div>
                      </td>

                      <td className="py-3 pr-4">
                        <select
                          disabled={isBusy}
                          value={lead.status ?? "New"}
                          onChange={(e) => onStatusChange(lead.id, e.target.value)}
                          className="h-9 w-[140px] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none"
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>

                        {od > 0 ? (
                          <div className="mt-2 inline-flex items-center rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-700">
                            Overdue by <span className="ml-1 font-semibold">{od}</span> day(s)
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3 pr-4">
                        <div className="text-sm text-zinc-900">{fmt(lead.follow_up_at)}</div>
                      </td>

                      <td className="py-3 pr-4">
                        <div className="text-sm text-zinc-900">{lead.source ?? "—"}</div>
                      </td>

                      <td className="py-3 pr-4">
                        <div className={`flex flex-wrap gap-2 ${isBusy ? "opacity-60 pointer-events-none" : ""}`}>
                          <button
                            onClick={() => onOpen(lead.id)}
                            className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                          >
                            Open
                          </button>

                          {wa ? (
                            <a
                              href={wa}
                              target="_blank"
                              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                            >
                              WhatsApp
                            </a>
                          ) : null}

                          {call ? (
                            <a
                              href={call}
                              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                            >
                              Call
                            </a>
                          ) : null}

                          <button
                            onClick={() => onSnoozeTomorrow(lead)}
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                          >
                            Snooze to Tomorrow
                          </button>

                          <button
                            onClick={() => onDoneClear(lead)}
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                          >
                            Done
                          </button>
                        </div>

                        {isBusy ? <div className="mt-2 text-xs text-zinc-500">Saving…</div> : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          Next: Agent name show by joining profiles table + Snooze 3 days / 1 week + auto-log WhatsApp/Call clicks.
        </div>
      </div>
    </div>
  );
}
