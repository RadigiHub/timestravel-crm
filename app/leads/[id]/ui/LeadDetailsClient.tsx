"use client";

import { useMemo, useState } from "react";
import type { Agent, Lead, LeadStatus } from "../../actions";
import { assignLeadAction, moveLeadAction } from "../../actions";

const STATUSES: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

function agentLabel(a: Agent) {
  const name = (a.full_name ?? "").trim();
  if (name) return name;

  const email = (a.email ?? "").trim();
  if (email) return email.split("@")[0] || email;

  return `Agent ${a.id.slice(0, 8)}`;
}

export default function LeadDetailsClient({
  lead,
  agents,
  activities,
}: {
  lead: Lead;
  agents: Agent[];
  activities: { id: string; type: string; message: string; created_at: string }[];
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<LeadStatus>((lead.status ?? "New") as LeadStatus);
  const [agentId, setAgentId] = useState<string>(lead.agent_id ?? "");

  const title = useMemo(() => {
    const n = (lead.full_name ?? "").trim();
    const p = (lead.phone ?? "").trim();
    const e = (lead.email ?? "").trim();
    return n || p || e || "Unnamed lead";
  }, [lead.full_name, lead.phone, lead.email]);

  const routeText = useMemo(() => {
    const from = (lead.departure ?? "").trim();
    const to = (lead.destination ?? "").trim();
    if (!from && !to) return "—";
    if (from && to) return `${from} → ${to}`;
    return from || to;
  }, [lead.departure, lead.destination]);

  const dateText = useMemo(() => {
    const d1 = (lead.travel_date ?? "").trim();
    const d2 = (lead.return_date ?? "").trim();
    if (!d1 && !d2) return "—";
    if (d1 && d2) return `${d1} / ${d2}`;
    return d1 || d2;
  }, [lead.travel_date, lead.return_date]);

  async function saveStatus(next: LeadStatus) {
    setBusy(true);
    setStatus(next);

    const res = await moveLeadAction({ id: lead.id, status: next });
    if (!res.ok) alert(res.error);

    setBusy(false);
  }

  async function saveAgent(next: string) {
    setBusy(true);
    setAgentId(next);

    const res = await assignLeadAction({ id: lead.id, agent_id: next || null });
    if (!res.ok) alert(res.error);

    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-lg font-semibold text-zinc-900">{title}</div>
        <div className="mt-1 text-xs text-zinc-500">Lead ID: {lead.id}</div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-3">
            <div className="text-xs text-zinc-500">Phone</div>
            <div className="text-sm text-zinc-900">{lead.phone ?? "—"}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 p-3">
            <div className="text-xs text-zinc-500">Email</div>
            <div className="text-sm text-zinc-900">{lead.email ?? "—"}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 p-3">
            <div className="text-xs text-zinc-500">Source</div>
            <div className="text-sm text-zinc-900">{lead.source ?? "—"}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 p-3">
            <div className="text-xs text-zinc-500">Route</div>
            <div className="text-sm text-zinc-900">{routeText}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 p-3">
            <div className="text-xs text-zinc-500">Travel Dates</div>
            <div className="text-sm text-zinc-900">{dateText}</div>
          </div>

          <div className="rounded-xl border border-zinc-200 p-3">
            <div className="text-xs text-zinc-500">Budget</div>
            <div className="text-sm text-zinc-900">{lead.budget ?? "—"}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-medium text-zinc-600">Status</div>
            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={status}
              onChange={(e) => saveStatus(e.target.value as LeadStatus)}
              disabled={busy}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-zinc-600">Assigned Agent</div>
            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={agentId}
              onChange={(e) => saveAgent(e.target.value)}
              disabled={busy}
            >
              <option value="">Unassigned</option>
              {agents
                .slice()
                .sort((a, b) => agentLabel(a).localeCompare(agentLabel(b)))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {agentLabel(a)}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        {lead.notes ? (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs font-medium text-zinc-600">Notes</div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">{lead.notes}</div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-zinc-600">No notes yet.</div>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-zinc-900">Timeline</div>

        <div className="mt-3 space-y-2">
          {activities?.length ? (
            activities.map((a) => (
              <div key={a.id} className="rounded-xl border border-zinc-200 p-3">
                <div className="text-xs text-zinc-500">
                  {a.type} • {new Date(a.created_at).toLocaleString()}
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
