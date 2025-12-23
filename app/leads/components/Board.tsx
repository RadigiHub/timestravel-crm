"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
} from "@dnd-kit/sortable";

import Column from "./Column";
import SortableLeadCard from "./SortableLeadCard";
import LeadCard from "./LeadCard";
import { moveLeadAction } from "../actions";
import type { Lead, LeadStatus } from "../types";

/** Normalize Lead object to avoid TS errors + null issues */
function normalizeLead(l: Lead): Lead {
  return {
    ...l,
    phone: l.phone ?? null,
    email: l.email ?? null,
    source: l.source ?? null,
    assigned_to: l.assigned_to ?? null,
    created_at: l.created_at ?? null,
    updated_at: l.updated_at ?? null,
    whatsapp_text: l.whatsapp_text ?? null,
    status_id: l.status_id ?? null,
    position: l.position ?? null,
    priority: l.priority ?? null,
    full_name: l.full_name ?? null,
  };
}

type Props = {
  statuses: LeadStatus[];
  initialLeads: Lead[];
};

export default function Board({ statuses, initialLeads }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 6 } })
  );

  const [leads, setLeads] = useState<Lead[]>(() => initialLeads.map(normalizeLead));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeFromStatusId, setActiveFromStatusId] = useState<string | null>(null);

  // Map leads by id for quick access
  const leadsById = useMemo(() => {
    const m = new Map<string, Lead>();
    for (const l of leads) m.set(l.id, l);
    return m;
  }, [leads]);

  // Order of ids per status
  const [orderByStatus, setOrderByStatus] = useState<Record<string, string[]>>({});

  // Build initial orderByStatus safely
  useEffect(() => {
    const normalized = initialLeads.map(normalizeLead);
    setLeads(normalized);

    const next: Record<string, string[]> = {};
    for (const s of statuses) next[s.id] = [];

    const fallbackStatusId = statuses[0]?.id ?? "unassigned";

    for (const l of normalized) {
      const sid = l.status_id ?? fallbackStatusId;
      if (!next[sid]) next[sid] = [];
      next[sid].push(l.id);
    }

    setOrderByStatus(next);
  }, [initialLeads, statuses]);

  function findContainerByLeadId(leadId: string): string | null {
    for (const [statusId, ids] of Object.entries(orderByStatus)) {
      if (ids.includes(leadId)) return statusId;
    }
    return null;
  }

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setActiveId(id);

    const fromStatusId =
      (e.active.data.current?.statusId as string | undefined) ??
      findContainerByLeadId(id);

    setActiveFromStatusId(fromStatusId ?? null);
  }

  function handleDragOver(e: DragOverEvent) {
    const active = e.active;
    const over = e.over;
    if (!over) return;

    const activeLeadId = String(active.id);
    const overId = String(over.id);

    const fromStatusId =
      (active.data.current?.statusId as string | undefined) ??
      activeFromStatusId ??
      findContainerByLeadId(activeLeadId);

    // If hovering over a column container, its id will be statusId
    const toStatusId = statuses.some((s) => s.id === overId)
      ? overId
      : findContainerByLeadId(overId);

    if (!fromStatusId || !toStatusId) return;

    if (fromStatusId === toStatusId) {
      // Reorder within same column
      const oldIndex = orderByStatus[fromStatusId]?.indexOf(activeLeadId) ?? -1;
      const newIndex = orderByStatus[toStatusId]?.indexOf(overId) ?? -1;
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      setOrderByStatus((prev) => ({
        ...prev,
        [fromStatusId]: arrayMove(prev[fromStatusId], oldIndex, newIndex),
      }));
      return;
    }

    // Move across columns
    setOrderByStatus((prev) => {
      const fromIds = [...(prev[fromStatusId] ?? [])];
      const toIds = [...(prev[toStatusId] ?? [])];

      const activeIndex = fromIds.indexOf(activeLeadId);
      if (activeIndex === -1) return prev;

      fromIds.splice(activeIndex, 1);

      const overIndex = toIds.indexOf(overId);
      const insertAt = overIndex === -1 ? toIds.length : overIndex;
      toIds.splice(insertAt, 0, activeLeadId);

      return {
        ...prev,
        [fromStatusId]: fromIds,
        [toStatusId]: toIds,
      };
    });

    // Update lead status in local state (optimistic)
    setLeads((prev) =>
      prev.map((l) =>
        l.id === activeLeadId ? { ...l, status_id: toStatusId } : l
      )
    );

    setActiveFromStatusId(toStatusId);
  }

  async function handleDragEnd(e: DragEndEvent) {
    const active = e.active;
    const over = e.over;

    const leadId = String(active.id);
    setActiveId(null);

    if (!over) return;

    const fromStatusId =
      (active.data.current?.statusId as string | undefined) ??
      findContainerByLeadId(leadId);

    const overId = String(over.id);
    const toStatusId = statuses.some((s) => s.id === overId)
      ? overId
      : findContainerByLeadId(overId);

    if (!fromStatusId || !toStatusId) return;

    // Persist: your action expects these fields (as per TS error you showed)
    try {
      await moveLeadAction({
        fromStatusId,
        toStatusId,
        fromOrderIds: orderByStatus[fromStatusId] ?? [],
        toOrderIds: orderByStatus[toStatusId] ?? [],
      });
    } catch (err) {
      // If server fails, best is to refresh or revert (keeping simple here)
      console.error("moveLeadAction failed", err);
    }
  }

  const activeLead = activeId ? leadsById.get(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        {statuses.map((s) => (
          <Column
            key={s.id}
            status={s}
            leadIds={orderByStatus[s.id] ?? []}
            leadsById={leadsById}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="w-[320px] opacity-95">
            <LeadCard lead={activeLead} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
