// app/leads/components/Board.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
} from "@dnd-kit/sortable";

import type { Lead, LeadStatus } from "../types";
import Column from "./Column";
import LeadCard from "./LeadCard";
import { moveLeadAction } from "../actions";

function normalizeLead(l: any): Lead {
  // Convert undefined -> null so TS + UI stays stable
  return {
    id: String(l.id),

    full_name: String(l.full_name ?? ""),
    phone: l.phone ?? null,
    email: l.email ?? null,
    source: l.source ?? null,

    status_id: l.status_id ?? null,
    priority: l.priority ?? null,

    from: l.from ?? null,
    to: l.to ?? null,
    trip_type: l.trip_type ?? null,
    depart_date: l.depart_date ?? null,
    return_date: l.return_date ?? null,
    cabin: l.cabin ?? null,
    budget: l.budget ?? null,
    preferred_airline: l.preferred_airline ?? null,

    adults: l.adults ?? null,
    children: l.children ?? null,
    infants: l.infants ?? null,

    whatsapp: l.whatsapp ?? null,
    whatsapp_text: l.whatsapp_text ?? null,

    notes: l.notes ?? null,
    follow_up_date: l.follow_up_date ?? null,

    assigned_to: l.assigned_to ?? null,
    created_at: l.created_at ?? null,
    updated_at: l.updated_at ?? null,
  };
}

export default function Board({
  statuses,
  leads,
}: {
  statuses: LeadStatus[];
  leads: Lead[];
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const normalizedLeads = useMemo(() => leads.map(normalizeLead), [leads]);

  const defaultStatusId = useMemo(() => {
    return statuses?.[0]?.id ?? "new";
  }, [statuses]);

  // Leads grouped by status for rendering
  const leadsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of statuses) map[s.id] = [];
    for (const l of normalizedLeads) {
      const sid = l.status_id ?? defaultStatusId;
      if (!map[sid]) map[sid] = [];
      map[sid].push(l);
    }
    return map;
  }, [normalizedLeads, statuses, defaultStatusId]);

  // ORDER for SortableContext (ids only)
  const [orderByStatus, setOrderByStatus] = useState<Record<string, string[]>>(
    {}
  );

  useEffect(() => {
    const next: Record<string, string[]> = {};
    for (const s of statuses) next[s.id] = [];
    for (const l of normalizedLeads) {
      const sid = l.status_id ?? defaultStatusId;
      if (!next[sid]) next[sid] = [];
      next[sid].push(l.id);
    }
    setOrderByStatus(next);
  }, [normalizedLeads, statuses, defaultStatusId]);

  // Overlay lead
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeLead = useMemo(() => {
    if (!activeId) return null;
    return normalizedLeads.find((l) => l.id === activeId) ?? null;
  }, [activeId, normalizedLeads]);

  // Helper: find status for a lead id
  const findStatusIdByLeadId = (leadId: string): string | null => {
    for (const [sid, ids] of Object.entries(orderByStatus)) {
      if (ids.includes(leadId)) return sid;
    }
    return null;
  };

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const active = String(e.active.id);
    const over = e.over?.id ? String(e.over.id) : null;

    setActiveId(null);
    if (!over) return;

    const fromStatusId = findStatusIdByLeadId(active);
    // Over can be a lead id OR a column id. We support both:
    const toStatusId =
      orderByStatus[over] ? over : findStatusIdByLeadId(over);

    if (!fromStatusId || !toStatusId) return;

    // Same column sorting
    if (fromStatusId === toStatusId) {
      const ids = orderByStatus[fromStatusId] ?? [];
      const oldIndex = ids.indexOf(active);
      const newIndex = ids.indexOf(over);
      if (oldIndex === -1 || newIndex === -1) return;

      const newIds = arrayMove(ids, oldIndex, newIndex);
      setOrderByStatus((prev) => ({ ...prev, [fromStatusId]: newIds }));

      // Persist order to DB (action expects from/to order lists)
      try {
        await moveLeadAction({
          fromStatusId,
          toStatusId,
          fromOrderIds: newIds,
          toOrderIds: newIds,
        });
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // Move across columns
    const fromIds = [...(orderByStatus[fromStatusId] ?? [])];
    const toIds = [...(orderByStatus[toStatusId] ?? [])];

    const fromIndex = fromIds.indexOf(active);
    if (fromIndex === -1) return;

    fromIds.splice(fromIndex, 1);

    // insert near "over" if over is a lead inside target column
    const overIndex = toIds.indexOf(over);
    if (overIndex >= 0) toIds.splice(overIndex, 0, active);
    else toIds.push(active);

    setOrderByStatus((prev) => ({
      ...prev,
      [fromStatusId]: fromIds,
      [toStatusId]: toIds,
    }));

    try {
      await moveLeadAction({
        fromStatusId,
        toStatusId,
        fromOrderIds: fromIds,
        toOrderIds: toIds,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6">
        {statuses.map((s) => (
          <Column
            key={s.id}
            status={s}
            leads={leadsByStatus[s.id] ?? []}
            orderIds={orderByStatus[s.id] ?? []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="w-[340px]">
            <LeadCard lead={activeLead} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
