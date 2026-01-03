"use client";

import { useMemo, useState } from "react";
import type { Agent, Lead, LeadStatus } from "../actions";

const STATUSES: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

export default function LeadCard({
  lead,
  agents,
  disabled,
  onMove,
  onAssign,
}: {
  lead: Lead;
  agents: Agent[];
  disabled: boolean;
  onMove: (id: string, status: LeadStatus) => void;
  onAssign: (id: string, assigned_to: string | null) => void;
}) {
  const [localStatus, setLocalStatus] = useState<LeadStatus>(lead.status ?? "New");

  const assignedLabel = useMemo(() => {
    if (!lead.assigned_to) return "Unassigned";
    const a = agents.find((x) => x.id === lead.assigned_to);
    return a?.full_name || a?.email || "Assigned";
  }, [lead.assigned_to, agents]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-900">
            {lead.full_name || "Unnamed Lead"}
          </div>
          <div className="mt-1 space-y-0.5 text-xs text-zinc-600">
            {lead.phone ? <div>{lead.phone}</div> : null}
            {lead.email ? <div className="truncate">{lead.email}</div> : null}
            {lead.destination ? <div>To: {lead.destination}</div> : null}
          </div>
        </div>

        <div className="text-[11px] text-zinc-500">{assignedLabel}</div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {/* Status */}
        <select
          className="w-full rounded-xl border px-3 py-2 text-sm"
          value={localStatus}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value as LeadStatus;
            setLocalStatus(next);
            onMove(lead.id, next);
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Assign */}
        <select
          className="w-full rounded-xl border px-3 py-2 text-sm"
          value={lead.assigned_to ?? ""}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value;
            onAssign(lead.id, v ? v : null);
          }}
        >
          <option value="">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name || a.email || a.id}
            </option>
          ))}
        </select>
      </div>

      {lead.notes ? (
        <div className="mt-2 line-clamp-3 text-xs text-zinc-600">{lead.notes}</div>
      ) : null}
    </div>
  );
}
