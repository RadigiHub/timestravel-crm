"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Column from "./Column";
import AddLeadModal from "./AddLeadModal";
import {
  moveLeadAction,
  listAgentsAction,
  assignLeadAction,
  type Lead,
  type LeadStatus,
  type Agent,
  type LeadStatusRow,
} from "../actions";

function normalizeLead(l: any): Lead {
  return {
    id: l.id,

    full_name: l.full_name ?? null,
    phone: l.phone ?? null,
    email: l.email ?? null,
    source: l.source ?? null,
    notes: l.notes ?? null,

    status: (l.status ?? "New") as LeadStatus,
    assigned_to: l.assigned_to ?? null,
    follow_up_at: l.follow_up_at ?? null,
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
  statuses,
  initialLeads,
}: {
  statuses: LeadStatusRow[];
  initialLeads: any[];
}) {
  const [pending, startTransition] = useTransition();
  const [leads, setLeads] = useState<Lead[]>(() => (initialLeads ?? []).map(normalizeLead));
  const [agents, setAgents] = useState<Agent[]>([]);

  // Use DB statuses for ordering, but map them into our LeadStatus union
  const columns: LeadStatus[] = useMemo(() => {
    const fallback: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

    const ordered = [...(statuses ?? [])].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );

    const labels = ordered
      .map((s) => s.label)
      .filter(Boolean)
      .map((lbl) => lbl.trim());

    // Keep only valid pipeline labels
    const validSet = new Set(fallback);
    const final = labels.filter((x) => validSet.has(x as LeadStatus)) as LeadStatus[];

    return final.length ? final : fallback;
  }, [statuses]);

  useEffect(() => {
    (async () => {
      const res = await listAgentsAction();
      if (res.ok) setAgents(res.data ?? []);
    })();
  }, []);

  function onMove(id: string, status: LeadStatus) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));

    startTransition(async () => {
      const res = await moveLeadAction({ id, status });
      if (!res.ok) {
        // optional: refetch / toast
      }
    });
  }

  function onAssign(id: string, assigned_to: string | null) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, assigned_to } : l)));

    startTransition(async () => {
      const res = await assignLeadAction({ id, assigned_to });
      if (!res.ok) {
        // optional rollback
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-zinc-900">Leads Board</div>
          <div className="text-sm text-zinc-600">Pipeline + assign agents.</div>
        </div>
        <AddLeadModal />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {columns.map((c) => (
          <Column
            key={c}
            title={c}
            leads={leads.filter((l) => l.status === c)}
            agents={agents}
            onMove={onMove}
            onAssign={onAssign}
            disabled={pending}
          />
        ))}
      </div>
    </div>
  );
}
