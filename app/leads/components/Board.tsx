"use client";

import { useMemo, useState } from "react";
import Column from "./Column";
import AddLeadModal from "./AddLeadModal";
import { assignLeadAction, moveLeadAction, type Agent, type Lead, type LeadStatus, type Brand } from "../actions";

const COLUMNS: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

function normalizeLead(l: any): Lead {
  return {
    id: l.id,
    full_name: l.full_name ?? null,
    phone: l.phone ?? null,
    email: l.email ?? null,
    source: l.source ?? null,
    notes: l.notes ?? null,

    status: (l.status ?? "New") as LeadStatus,

    // ✅ IMPORTANT: agent_id + brand_id
    agent_id: l.agent_id ?? null,
    brand_id: l.brand_id ?? null,

    created_at: l.created_at,

    departure: l.departure ?? null,
    destination: l.destination ?? null,
    travel_date: l.travel_date ?? null,
    return_date: l.return_date ?? null,

    pax_adults: l.pax_adults ?? null,
    pax_children: l.pax_children ?? null,
    pax_infants: l.pax_infants ?? null,

    budget: l.budget ?? null,
    airline: l.airline ?? null,
    cabin: l.cabin ?? null,
  };
}

export default function Board({
  initialLeads,
  agents,
  brands,
}: {
  initialLeads: any[];
  agents: Agent[];
  brands: Brand[];
}) {
  const [leads, setLeads] = useState<Lead[]>(() => (initialLeads ?? []).map(normalizeLead));
  const [disabled, setDisabled] = useState(false);

  const leadsByStatus = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {
      New: [],
      Contacted: [],
      "Follow-Up": [],
      Booked: [],
      Lost: [],
    };
    for (const l of leads) {
      const key = (l.status ?? "New") as LeadStatus;
      (map[key] ?? map.New).push(l);
    }
    return map;
  }, [leads]);

  async function onMove(id: string, status: LeadStatus) {
    setDisabled(true);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));

    const res = await moveLeadAction({ id, status });
    if (!res.ok) alert(res.error);

    setDisabled(false);
  }

  async function onAssign(id: string, agent_id: string | null) {
    setDisabled(true);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, agent_id } : l)));

    const res = await assignLeadAction({ id, agent_id });
    if (!res.ok) alert(res.error);

    setDisabled(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-zinc-900">Leads Board</div>
          <div className="text-sm text-zinc-600">Pipeline view (stable build)</div>
        </div>

        <AddLeadModal agents={agents} brands={brands} />
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {COLUMNS.map((col) => (
          <Column
            key={col}
            title={col}
            leads={leadsByStatus[col] ?? []}
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
