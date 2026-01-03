"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import Column from "./Column";
import AddLeadModal from "./AddLeadModal";
import {
  moveLeadAction,
  listAgentsAction,
  type Lead,
  type LeadStage,
  type LeadStatus,
  type Agent,
} from "../actions";

function normalizeLead(l: any): Lead {
  return {
    id: l.id,
    full_name: l.full_name ?? null,
    phone: l.phone ?? null,
    email: l.email ?? null,
    source: l.source ?? null,
    notes: l.notes ?? null,
    status: (l.status ?? "New") as LeadStage,
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
  statuses: LeadStatus[];
  initialLeads: any[];
}) {
  const [leads, setLeads] = useState<Lead[]>(
    () => (initialLeads ?? []).map(normalizeLead)
  );
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    (async () => {
      const res = await listAgentsAction();
      if (res.ok) setAgents(res.data ?? []);
    })();
  }, []);

  const orderedStatuses = useMemo(() => {
    const arr = [...(statuses ?? [])];
    arr.sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999));
    return arr;
  }, [statuses]);

  const leadsById = useMemo(() => {
    const map: Record<string, Lead> = {};
    for (const l of leads) map[l.id] = l;
    return map;
  }, [leads]);

  const leadIdsByStatus = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const s of orderedStatuses) m[s.id] = [];
    for (const l of leads) {
      const statusRow = orderedStatuses.find((s) => s.label === l.status);
      if (statusRow) m[statusRow.id].push(l.id);
    }
    return m;
  }, [leads, orderedStatuses]);

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const overStatusId = String(over.id);

    const statusRow = orderedStatuses.find((s) => s.id === overStatusId);
    if (!statusRow) return;

    const newStage = statusRow.label;

    // optimistic
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStage } : l))
    );

    const res = await moveLeadAction({ id: leadId, status: newStage });
    if (!res.ok) {
      // fallback: simple revert by refetch not implemented yet
      // (abhi build green + working drag first)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-zinc-900">Leads Board</div>
          <div className="text-sm text-zinc-600">
            Drag & drop pipeline (status rows from lead_statuses).
          </div>
        </div>
        <AddLeadModal />
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {orderedStatuses.map((s) => (
            <SortableContext
              key={s.id}
              items={leadIdsByStatus[s.id] ?? []}
              strategy={verticalListSortingStrategy}
            >
              <Column
                status={s}
                leadIds={leadIdsByStatus[s.id] ?? []}
                leadsById={leadsById}
                onView={() => {}}
                onAction={() => {}}
              />
            </SortableContext>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
