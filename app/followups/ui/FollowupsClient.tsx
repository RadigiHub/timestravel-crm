"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import QuickLeadActions from "@/components/QuickLeadActions";
import { daysOverdueISO } from "@/lib/leadLinks";
import { snoozeFollowupTomorrowAction, setLeadStatusAction } from "../actions";

type FollowupsInitial = {
  total: number;
  overdue: number;
  items: any[];
};

function fmt(dt: string | null | undefined) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleString();
}

export default function FollowupsClient({ initial }: { initial: FollowupsInitial }) {
  const router = useRouter();
  const [items, setItems] = React.useState<any[]>(initial?.items ?? []);
  const [total, setTotal] = React.useState<number>(initial?.total ?? 0);
  const [overdue, setOverdue] = React.useState<number>(initial?.overdue ?? 0);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    setItems(initial?.items ?? []);
    setTotal(initial?.total ?? 0);
    setOverdue(initial?.overdue ?? 0);
  }, [initial]);

  const onSnoozeTomorrow = async (leadId: string) => {
    setErr(null);
    setBusyId(leadId);
    const res = await snoozeFollowupTomorrowAction(leadId);
    setBusyId(null);

    if (!res.ok) {
      setErr(res.error);
      return;
    }

    // refresh server data
    router.refresh();
  };

  const onStatusChange = async (leadId: string, status: string) => {
    setErr(null);
    setBusyId(leadId);
    const res = await setLeadStatusAction(leadId, status);
    setBusyId(null);

    if (!res.ok) {
      setErr(res.error);
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">Follow-ups Due</div>
            <div className="mt-1 text-sm text-zinc-600">
              Due today + overdue (Booked/Lost excluded)
            </div>
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
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                <th className="py-2 pr-4">Lead</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Follow-up At</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="py-6 text-center text-zinc-500" colSpan={5}>
                    No follow-ups due 🎉
                  </td>
                </tr>
              ) : (
                items.map((lead: any) => {
                  const followAt = lead?.follow_up_at as string | undefined;
                  const isBusy = busyId === lead?.id;

                  const overdueDays =
                    followAt && new Date(followAt).getTime() < Date.now()
                      ? daysOverdueISO(followAt)
                      : 0;

                  return (
                    <tr key={lead.id} className="border-b border-zinc-100 align-top">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-zinc-900">{lead?.full_name ?? "—"}</div>
                        <div className="text-xs text-zinc-600">
                          {lead?.phone ?? "—"} • {lead?.email ?? "—"}
                        </div>
                        {lead?.notes ? (
                          <div className="mt-1 text-xs text-zinc-500 line-clamp-1">{lead.notes}</div>
                        ) : null}
                      </td>

                      <td className="py-3 pr-4">
                        <select
                          disabled={isBusy}
                          value={lead?.status ?? "New"}
                          onChange={(e) => onStatusChange(lead.id, e.target.value)}
                          className="h-9 w-[140px] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none"
                        >
                          {["New", "Contacted", "Follow-Up", "Booked", "Lost"].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>

                        {overdueDays > 0 ? (
                          <div className="mt-2 inline-flex items-center rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-700">
                            Overdue by <span className="ml-1 font-semibold">{overdueDays}</span> day(s)
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3 pr-4">
                        <div className="text-sm text-zinc-900">{fmt(followAt)}</div>
                      </td>

                      <td className="py-3 pr-4">
                        <div className="text-sm text-zinc-900">{lead?.source ?? "—"}</div>
                      </td>

                      <td className="py-3 pr-4">
                        <div className={isBusy ? "opacity-60 pointer-events-none" : ""}>
                          <QuickLeadActions
                            lead={lead}
                            openHref={`/leads/${lead.id}`}
                            onSnoozeTomorrow={() => onSnoozeTomorrow(lead.id)}
                          />
                        </div>
                        {isBusy ? (
                          <div className="mt-2 text-xs text-zinc-500">Saving…</div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          Next: “Snooze 3 days / 1 week”, WhatsApp/Call click auto-log + “Done” (clear follow-up).
        </div>
      </div>
    </div>
  );
}
