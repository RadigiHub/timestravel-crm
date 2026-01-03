"use client";

import LeadCard from "./LeadCard";
import type { Agent, Lead, LeadStatus } from "../actions";

export default function Column({
  title,
  leads,
  agents,
  onMove,
  onAssign,
  disabled,
}: {
  title: LeadStatus;
  leads: Lead[];
  agents: Agent[];
  onMove: (id: string, status: LeadStatus) => void | Promise<void>;
  onAssign: (id: string, assigned_to: string | null) => void | Promise<void>;
  disabled: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        <div className="text-xs text-zinc-500">{leads.length}</div>
      </div>

      <div className="space-y-2">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            agents={agents}
            disabled={disabled}
            onMove={onMove}
            onAssign={onAssign}
          />
        ))}
      </div>
    </div>
  );
}
