"use client";

import { useMemo, useState } from "react";
import type { Agent, Lead, LeadActivity, LeadStatus } from "../../actions";
import {
  updateLeadAgentAction,
  updateLeadFollowUpAction,
  updateLeadNotesAction,
  updateLeadStatusAction,
} from "../../actions";

const STATUSES: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

function agentLabel(a: Agent) {
  const name = (a.full_name ?? "").trim();
  if (name) return name;
  const email = (a.email ?? "").trim();
  if (email) return email.split("@")[0] || email;
  return `Agent ${a.id.slice(0, 8)}`;
}

function fmtDT(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

export default function LeadDetailsClient({
  lead,
  agents,
  activities,
}: {
  lead: Lead;
  agents: Agent[];
  activities: LeadActivity[];
}) {
  const [busy, setBusy] = useState(false);

  const [status, setStatus] = useState<LeadStatus>((lead.status ?? "New") as LeadStatus);
  const [agentId, setAgentId] = useState<string>(lead.agent_id ?? "");
  const [followUp, setFollowUp] = useState<string>(() => {
    // input[type=datetime-local] expects: YYYY-MM-DDTHH:mm
    if (!lead.follow_up_at) return "";
    const d = new Date(lead.follow_up_at);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const [note, setNote] = useState<string>(lead.notes ?? "");
  const [localActs, setLocalActs] = useState<LeadActivity[]>(activities ?? []);

  const sortedAgents = useMemo(() => {
    const copy = [...(agents ?? [])];
    copy.sort((a, b) => agentLabel(a).localeCompare(agentLabel(b)));
    return copy;
  }, [agents]);

  function pushActivity(type: string, message: string) {
    // local optimistic (UI only)
    const fake: LeadActivity = {
      id: `local-${Date.now()}`,
      lead_id: lead.id,
      type,
      message,
      created_at: new Date().toISOString(),
    };
    setLocalActs((prev) => [fake, ...prev]);
  }

  async function saveStatus(next: LeadStatus) {
    setStatus(next);
    setBusy(true);
    pushActivity("status", `Status changed to ${next}`);

    const res = await updateLeadStatusAction({ id: lead.id, status: next });
    if (!res.ok) {
      alert(res.error);
    }
    setBusy(false);
  }

  async function saveAgent(nextAgentId: string) {
    setAgentId(nextAgentId);
    setBusy(true);

    const label = nextAgentId
      ? agentLabel(sortedAgents.find((a) => a.id === nextAgentId) ?? ({} as any))
      : "Unassigned";

    pushActivity("assign", `Assigned to ${label}`);

    const res = await updateLeadAgentAction({
      id: lead.id,
      agent_id: nextAgentId ? nextAgentId : null,
      agent_label: label,
    });

    if (!res.ok) alert(res.error);
    setBusy(false);
  }

  async function saveFollowUp() {
    setBusy(true);

    // Convert datetime-local => ISO
    const iso = followUp ? new Date(followUp).toISOString() : null;
    pushActivity("followup", iso ? `Follow-up set: ${iso}` : "Follow-up cleared");

    const res = await updateLeadFollowUpAction({ id: lead.id, follow_up_at: iso });
    if (!res.ok) alert(res.error);

    setBusy(false);
  }

  async function saveNotes() {
    setBusy(true);
    pushActivity("note", "Notes updated");

    const res = await updateLeadNotesAction({
      id: lead.id,
      notes: note.trim() ? note.trim() : null,
    });

    if (!res.ok) alert(res.error);
    setBusy(false);
  }

  const headerTitle =
    (lead.full_name ?? "").trim() || (lead.phone ?? "").trim() || (lead.email ?? "").trim() || "Unnamed lead";

  const headerSub = [lead.phone, lead.email, lead.source].filter(Boolean).join(" • ");

  const paxLabel = `${lead.pax_adults ?? 0}A • ${lead.pax_children ?? 0}C • ${lead.pax_infants ?? 0}I`;

  return (
    <div className="space-y-4">
      {/* Top Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-zinc-900">{headerTitle}</div>
            {headerSub ? <div className="mt-1 text-sm text-zinc-600">{headerSub}</div> : null}
            <div className="mt-2 text-xs text-zinc-500">Created: {fmtDT(lead.created_at)}</div>
          </div>

          <div className="grid w-full gap-2 md:w-[360px]">
            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={status}
              disabled={busy}
              onChange={(e) => saveStatus(e.target.value as LeadStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={agentId}
              disabled={busy}
              onChange={(e) => saveAgent(e.target.value)}
            >
              <option value="">Unassigned</option>
              {sortedAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {agentLabel(a)}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                value={followUp}
                disabled={busy}
                onChange={(e) => setFollowUp(e.target.value)}
              />
              <button
                onClick={saveFollowUp}
                disabled={busy}
                className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                type="button"
              >
                Save
              </button>
            </div>

            <div className="text-xs text-zinc-500">Follow-up (set/cancel). This will power “Follow-ups Due”.</div>
          </div>
        </div>
      </div>

      {/* Trip Details */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-zinc-900">Trip Details</div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">Departure</div>
            <div className="mt-1 text-sm font-medium text-zinc-900">{lead.departure ?? "—"}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">Destination</div>
            <div className="mt-1 text-sm font-medium text-zinc-900">{lead.destination ?? "—"}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">Travel date</div>
            <div className="mt-1 text-sm font-medium text-zinc-900">{lead.travel_date ?? "—"}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">Return date</div>
            <div className="mt-1 text-sm font-medium text-zinc-900">{lead.return_date ?? "—"}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">Cabin</div>
            <div className="mt-1 text-sm font-medium text-zinc-900">{lead.cabin ?? "—"}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">Preferred airline</div>
            <div className="mt-1 text-sm font-medium text-zinc-900">{lead.airline ?? "—"}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">Passengers</div>
            <div className="mt-1 text-sm font-medium text-zinc-900">{paxLabel}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-500">Budget</div>
            <div className="mt-1 text-sm font-medium text-zinc-900">
              {lead.budget != null ? `£${lead.budget}pp` : "—"}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs text-zinc-500">Notes</div>
          <textarea
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            rows={3}
            value={note}
            disabled={busy}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="mt-2 flex items-center justify-end">
            <button
              onClick={saveNotes}
              disabled={busy}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              type="button"
            >
              Save Notes
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-zinc-900">Timeline</div>

        <div className="mt-3 space-y-2">
          {localActs.length ? (
            localActs.map((a) => (
              <div key={a.id} className="rounded-xl border border-zinc-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium text-zinc-600">{a.type}</div>
                  <div className="text-xs text-zinc-500">{fmtDT(a.created_at)}</div>
                </div>
                <div className="mt-1 text-sm text-zinc-900">{a.message}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-zinc-600">No activity yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
