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
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { moveLeadAction } from "../actions";
import SortableLeadCard from "./SortableLeadCard";
import LeadCard from "./LeadCard";

/* ---------------- Types ---------------- */

type Status = {
  id: string;
  label: string;
  position: number;
  color?: string | null;
};

export type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status_id: string;
  position: number;
  priority: "hot" | "warm" | "cold";
  assigned_to: string | null;

  trip_type?: "oneway" | "return" | "multicity";
  departure?: string | null;
  destination?: string | null;
  depart_date?: string | null;
  return_date?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  cabin_class?: "economy" | "premium" | "business" | "first";
  preferred_airline?: string | null;
  budget?: string | null;
  whatsapp_text?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;

  created_at?: string;
  updated_at?: string;
};

type Props = {
  statuses: Status[];
  initialLeads: Lead[];
};

/* ---------------- Small UI helpers ---------------- */

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ---------------- Main ---------------- */

export default function Board({ statuses, initialLeads }: Props) {
  // group leads by status_id
  const [byStatus, setByStatus] = useState<Record<string, Lead[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const statusIds = useMemo(() => statuses.map((s) => s.id), [statuses]);

  // sensors FIX: distance / delay to prevent "auto-drop"
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // mouse drag must move 8px before activation
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180, // touch must hold 180ms
        tolerance: 6, // can move 6px during hold
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const grouped: Record<string, Lead[]> = {};
    for (const s of statuses) grouped[s.id] = [];
    for (const l of initialLeads ?? []) {
      if (!grouped[l.status_id]) grouped[l.status_id] = [];
      grouped[l.status_id].push(l);
    }
    // ensure sorted by position
    for (const key of Object.keys(grouped)) {
      grouped[key] = grouped[key].slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
    setByStatus(grouped);
  }, [initialLeads, statuses]);

  const allLeadsFlat = useMemo(() => {
    const out: Lead[] = [];
    for (const sId of statusIds) out.push(...(byStatus[sId] ?? []));
    return out;
  }, [byStatus, statusIds]);

  const activeLead = useMemo(() => {
    if (!activeId) return null;
    return allLeadsFlat.find((l) => l.id === activeId) ?? null;
  }, [activeId, allLeadsFlat]);

  function findContainerId(leadId: string): string | null {
    for (const sId of statusIds) {
      const arr = byStatus[sId] ?? [];
      if (arr.some((l) => l.id === leadId)) return sId;
    }
    return null;
  }

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setActiveId(id);
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);

    if (!over) return;

    const activeLeadId = String(active.id);
    const overId = String(over.id);

    const fromStatusId = findContainerId(activeLeadId);
    if (!fromStatusId) return;

    // over can be:
    // 1) a lead id (dropping over another card)
    // 2) a status column id (dropping into empty space / column)
    const toStatusId = statusIds.includes(overId) ? overId : findContainerId(overId);

    if (!toStatusId) return;

    // no move
    if (fromStatusId === toStatusId) {
      // reorder within same column
      const list = byStatus[fromStatusId] ?? [];
      const oldIndex = list.findIndex((l) => l.id === activeLeadId);
      const newIndex = statusIds.includes(overId)
        ? list.length - 1
        : list.findIndex((l) => l.id === overId);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

      const next = arrayMove(list, oldIndex, newIndex).map((l, idx) => ({
        ...l,
        position: idx,
      }));

      setByStatus((prev) => ({ ...prev, [fromStatusId]: next }));

      // persist order
      try {
        await moveLeadAction({
          fromStatusId,
          toStatusId,
          fromOrderIds: next.map((l) => l.id),
          toOrderIds: next.map((l) => l.id),
        });
      } catch (err) {
        // optional: revert by reloading page if you want
        console.error(err);
      }
      return;
    }

    // move across columns
    const fromList = (byStatus[fromStatusId] ?? []).slice();
    const toList = (byStatus[toStatusId] ?? []).slice();

    const movingIndex = fromList.findIndex((l) => l.id === activeLeadId);
    if (movingIndex < 0) return;

    const [moving] = fromList.splice(movingIndex, 1);

    const insertIndex = statusIds.includes(overId)
      ? toList.length
      : Math.max(0, toList.findIndex((l) => l.id === overId));

    const safeInsertIndex = insertIndex < 0 ? toList.length : insertIndex;

    toList.splice(safeInsertIndex, 0, { ...moving, status_id: toStatusId });

    const nextFrom = fromList.map((l, idx) => ({ ...l, position: idx }));
    const nextTo = toList.map((l, idx) => ({ ...l, position: idx }));

    setByStatus((prev) => ({
      ...prev,
      [fromStatusId]: nextFrom,
      [toStatusId]: nextTo,
    }));

    try {
      await moveLeadAction({
        fromStatusId,
        toStatusId,
        fromOrderIds: nextFrom.map((l) => l.id),
        toOrderIds: nextTo.map((l) => l.id),
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-3">
        {statuses.map((status) => {
          const items = byStatus[status.id] ?? [];
          return (
            <div
              key={status.id}
              id={status.id}
              className="min-w-[320px] max-w-[380px] flex-shrink-0 rounded-2xl border border-zinc-200 bg-white p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: status.color ?? "#3b82f6" }}
                  />
                  <div className="text-sm font-semibold text-zinc-900">{status.label}</div>
                </div>
                <div className="text-xs font-semibold text-zinc-500">{items.length}</div>
              </div>

              {/* Make column droppable by using its id in SortableContext (and allow drop on column id) */}
              <SortableContext items={items.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div
                  className={cx(
                    "min-h-[72px] rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-2",
                    items.length === 0 && "flex items-center justify-center text-sm text-zinc-400"
                  )}
                  // IMPORTANT: overId can be this status.id (dropping into empty space)
                  data-status-id={status.id}
                >
                  {items.length === 0 ? (
                    <div id={status.id}>Drop leads here</div>
                  ) : (
                    <div className="flex flex-col gap-2" id={status.id}>
                      {items.map((lead) => (
                        <SortableLeadCard key={lead.id} lead={lead} />
                      ))}
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      {/* Drag overlay FIX: smoother + prevents accidental drop feeling */}
      <DragOverlay>
        {activeLead ? (
          <div className="rotate-[0.5deg]">
            <LeadCard lead={activeLead} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
