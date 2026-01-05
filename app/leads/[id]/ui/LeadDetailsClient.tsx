"use client";

import { useMemo, useState } from "react";
import { assignLeadAction, moveLeadAction } from "@/app/leads/actions";

type Agent = {
  id: string;
  full_name: string | null;
  email?: string | null;
};

type Activity = {
  id: string;
  lead_id: string;
  type: string;
  message: string | null;
  created_at: string;
};

type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

type Lead = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  notes: string | null;
  status: LeadStatus;

  agent_id: string | null;
  brand_id: string | null;

  follow_up_at: string | null;
  created_at: string;

  departure: string | null;
  destination: string | null;
  travel_date: string | null;
  return_date: string | null;

  pax_adults: number | null;
  pax_children: number | null;
  pax_infants: number | null;

  budget: number | null;
  airline: string | null;
  cabin: string | null;
};

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
  activities: Activity[];
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<LeadStatus>((lead.status ?? "New") as LeadStatus);
  const [agentId, setAgentId] = useState<string>(lead.agent_id ?? "");

  const title = useMemo(() => {
    const n = (lead.full_name ?? "").trim();
    const p = (lead.phone ?? "").trim();
    const e = (lead.email ?? "").trim();
    return n || p || e || "Lead";
  }, [lead.full_name, lead.phone, lead.email]);

  async function updateStatus(next: LeadStatus) {
    setBusy(true);
    setStatus(next);

    const res = await moveLeadAction({ id: lead.id, status: next });
    if (!res.ok) alert(res.error);

    setBusy(false);
  }

  async function updateAgent(next: string) {
    setBusy(true);
    setAgentId(next);

    const res = await assignLeadAction({ id: lead.id, agent_id: next ? next : null });
    if (!res.ok) alert(res.error);

    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {/* Top Summary */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xl font-semibold text-zinc-900">{title}</div>
            <div className="mt-1 text-sm text-zinc-600">
              {lead.phone ? <span>{lead.phone}</span> : null}
              {lead.phone && lead.email ? <span> • </span> : null}
              {lead.email ? <span>{lead.email}</span> : null}
              {(lead.phone || lead.email) && lead.source ? <span> • </span> : null}
              {lead.source ? <span>{lead.source}</span> : null}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              Created: {lead.created_at ? new Date(lead.created_at).toLocaleString() : "-"}
            </div>
          </div>

          <div className="grid w-full gap-2 md:w-[360px]">
            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={status}
              onChange={(e) => updateStatus(e.target.value as LeadStatus)}
              disabled={busy}
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
              onChange={(e) => updateAgent(e.target.value)}
              disabled={busy}
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {agentLabel(a)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Trip Details */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-zinc-900">Trip Details</div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Info label="Departure" value={lead.departure} />
          <Info label="Destination" value={lead.destination} />
          <Info label="Travel date" value={lead.travel_date} />
          <Info label="Return date" value={lead.return_date} />
          <Info label="Cabin" value={lead.cabin} />
          <Info label="Preferred airline" value={lead.airline} />
          <Info
            label="Passengers"
            value={`${lead.pax_adults ?? 0}A • ${lead.pax_children ?? 0}C • ${lead.pax_infants ?? 0}I`}
          />
          <Info label="Budget" value={lead.budget != null ? String(lead.budget) : null} />
        </div>

        {lead.notes ? (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs font-medium text-zinc-600">Notes</div>
            <div className="mt-1 text-sm text-zinc-800 whitespace-pre-wrap">{lead.notes}</div>
          </div>
        ) : null}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-zinc-900">Timeline</div>

        <div className="mt-3 space-y-3">
          {activities?.length ? (
            activities.map((a) => (
              <div key={a.id} className="rounded-xl border border-zinc-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-zinc-900">{a.type}</div>
                  <div className="text-xs text-zinc-500">
                    {a.created_at ? new Date(a.created_at).toLocaleString() : "-"}
                  </div>
                </div>
                {a.message ? <div className="mt-1 text-sm text-zinc-700">{a.message}</div> : null}
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

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-3">
      <div className="text-xs font-medium text-zinc-600">{label}</div>
      <div className="mt-1 text-sm text-zinc-900">{value ? value : "—"}</div>
    </div>
  );
}
