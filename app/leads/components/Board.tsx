"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Column from "./Column";
import LeadCard from "./LeadCard";
import { moveLeadAction } from "../actions";

type Status = {
  id: string;
  label: string;
  position: number;
  color?: string | null;
};

export type Lead = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  status_id: string;
  position?: number | null;
  priority?: "hot" | "warm" | "cold" | string;
  assigned_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  // optional extra fields (form se aate hon to)
  from_city?: string | null;
  to_city?: string | null;
  trip_type?: string | null;
  depart_date?: string | null;
  return_date?: string | null;
  cabin?: string | null;
  budget?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  whatsapp?: string | null;
  followup_date?: string | null;
  notes?: string | null;
};

function arrayMove<T>(arr: T[], from: number, to: number) {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export default function Board({
  statuses,
  initialLeads,
}: {
  statuses: Status[];
  initialLeads: Lead[];
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 }, // ✅ prevents accidental quick drop
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 }, // ✅ mobile smooth
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group leads by status_id
  const [leadsByStatus, setLeadsByStatus] = useState<Record<string, Lead[]>>(
    () => {
      const map: Record<string, Lead[]> = {};
      for (const s of statuses) map[s.id] = [];
      for (const l of initialLeads ?? []) {
        if (!map[l.status_id]) map[l.status_id] = [];
        map[l.status_id].push(l);
      }
      // sort by position if exists
      for (const k of Object.keys(map)) {
        map[k] = map[k].slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      }
      return map;
    }
  );

  // if initialLeads change after save
  useEffect(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of statuses) map[s.id] = [];
    for (const l of initialLeads ?? []) {
      if (!map[l.status_id]) map[l.status_id] = [];
      map[l.status_id].push(l);
    }
    for (const k of Object.keys(map)) {
      map[k] = map[k].slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
    setLeadsByStatus(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialLeads), JSON.stringify(statuses)]);

  const allLeads = useMemo(() => {
    return Object.values(leadsByStatus).flat();
  }, [leadsByStatus]);

  const leadById = useMemo(() => {
    const m = new Map<string, Lead>();
    for (const l of allLeads) m.set(l.id, l);
    return m;
  }, [allLeads]);

  const [activeId, setActiveId] = useState<string | null>(null);

  const activeLead = useMemo(() => {
    if (!activeId) return null;
    return leadById.get(activeId) ?? null;
  }, [activeId, leadById]);

  function findStatusOfLead(leadId: string): string | null {
    for (const statusId of Object.keys(leadsByStatus)) {
      if (leadsByStatus[statusId].some((l) => l.id === leadId)) return statusId;
    }
    return null;
  }

  function getIndex(statusId: string, leadId: string) {
    return leadsByStatus[statusId]?.findIndex((l) => l.id === leadId) ?? -1;
  }

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveId(id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLeadId = String(active.id);
    const overId = String(over.id);

    const fromStatusId = findStatusOfLead(activeLeadId);
    if (!fromStatusId) return;

    // over can be:
    // - a lead id (dropping onto another lead)
    // - a status column id (dropping into empty column area)
    const toStatusId = statuses.some((s) => s.id === overId)
      ? overId
      : findStatusOfLead(overId);

    if (!toStatusId) return;

    if (fromStatusId === toStatusId) {
      // reorder within same column
      const oldIndex = getIndex(fromStatusId, activeLeadId);
      const newIndex =
        statuses.some((s) => s.id === overId) ? (leadsByStatus[toStatusId]?.length ?? 0) : getIndex(toStatusId, overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const newArr = arrayMove(leadsByStatus[fromStatusId], oldIndex, newIndex);

      // optimistic
      setLeadsByStatus((prev) => ({
        ...prev,
        [fromStatusId]: newArr,
      }));

      // ✅ action signature: from/to + order arrays
      try {
        await moveLeadAction({
          fromStatusId,
          toStatusId,
          fromOrderIds: newArr.map((l) => l.id),
          toOrderIds: newArr.map((l) => l.id),
        });
      } catch (e) {
        // fallback refresh behavior (optional)
        console.error("moveLeadAction failed", e);
      }
      return;
    }

    // move across columns
    const fromArr = [...(leadsByStatus[fromStatusId] ?? [])];
    const toArr = [...(leadsByStatus[toStatusId] ?? [])];

    const fromIndex = fromArr.findIndex((l) => l.id === activeLeadId);
    if (fromIndex === -1) return;

    const movingLead = { ...fromArr[fromIndex], status_id: toStatusId };
    fromArr.splice(fromIndex, 1);

    const insertIndex =
      statuses.some((s) => s.id === overId) ? toArr.length : Math.max(0, toArr.findIndex((l) => l.id === overId));

    if (insertIndex === -1) {
      toArr.push(movingLead);
    } else {
      toArr.splice(insertIndex, 0, movingLead);
    }

    // optimistic
    setLeadsByStatus((prev) => ({
      ...prev,
      [fromStatusId]: fromArr,
      [toStatusId]: toArr,
    }));

    try {
      await moveLeadAction({
        fromStatusId,
        toStatusId,
        fromOrderIds: fromArr.map((l) => l.id),
        toOrderIds: toArr.map((l) => l.id),
      });
    } catch (e) {
      console.error("moveLeadAction failed", e);
    }
  };

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-3">
          {statuses.map((s) => (
            <Column
              key={s.id}
              status={s}
              // IMPORTANT: Column should accept `leads` and use SortableLeadCard inside
              leads={leadsByStatus[s.id] ?? []}
            />
          ))}
        </div>

        {/* ✅ Drag preview */}
        <DragOverlay>
          {activeLead ? (
            <div className="w-[320px]">
              <LeadCard lead={activeLead} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
