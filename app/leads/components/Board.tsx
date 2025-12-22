"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { moveLeadAction } from "../actions";
import SortableLeadCard from "./SortableLeadCard";
import LeadCard from "./LeadCard";

/* ---------------- Types ---------------- */
export type Status = {
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
  created_at: string;
  updated_at: string;

  // optional fields (agar tumhare DB me hain to ok, warna ignore)
  trip_type?: string | null;
  from_city?: string | null;
  to_city?: string | null;
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
  airline?: string | null;
};

/* ---------------- Props ---------------- */
export default function Board({
  statuses,
  initialLeads,
}: {
  statuses: Status[];
  initialLeads: Lead[];
}) {
  // map leads by status => ordered ids
  const [leadById, setLeadById] = useState<Record<string, Lead>>({});
  const [idsByStatus, setIdsByStatus] = useState<Record<string, string[]>>({});
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  // init state
  useEffect(() => {
    const map: Record<string, Lead> = {};
    for (const l of initialLeads) map[l.id] = l;
    setLeadById(map);

    const by: Record<string, Lead[]> = {};
    for (const s of statuses) by[s.id] = [];
    for (const l of initialLeads) {
      if (!by[l.status_id]) by[l.status_id] = [];
      by[l.status_id].push(l);
    }
    // stable order: position then updated_at
    const ids: Record<string, string[]> = {};
    for (const s of statuses) {
      const arr = (by[s.id] ?? [])
        .sort((a, b) => {
          if (a.position !== b.position) return a.position - b.position;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        })
        .map((x) => x.id);
      ids[s.id] = arr;
    }
    setIdsByStatus(ids);
  }, [initialLeads, statuses]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      // mouse: accidental drop prevent
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      // touch: long-press to start drag (prevents auto-drop)
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const statusOrder = useMemo(() => statuses.map((s) => s.id), [statuses]);

  function findStatusIdByLeadId(leadId: string): string | null {
    for (const sid of Object.keys(idsByStatus)) {
      if ((idsByStatus[sid] ?? []).includes(leadId)) return sid;
    }
    return null;
  }

  const activeLead = activeLeadId ? leadById[activeLeadId] : null;

  /* ---------------- DnD Handlers ---------------- */
  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setActiveLeadId(id);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // if dragging over a status column
    const overIsStatus = statusOrder.includes(overId);

    const fromStatusId = findStatusIdByLeadId(activeId);
    if (!fromStatusId) return;

    const toStatusId = overIsStatus ? overId : findStatusIdByLeadId(overId);
    if (!toStatusId) return;

    if (fromStatusId === toStatusId) return;

    setIdsByStatus((prev) => {
      const next = { ...prev };
      const fromArr = [...(next[fromStatusId] ?? [])];
      const toArr = [...(next[toStatusId] ?? [])];

      const fromIndex = fromArr.indexOf(activeId);
      if (fromIndex === -1) return prev;

      fromArr.splice(fromIndex, 1);

      // insert near hovered lead (if over lead), otherwise end
      if (!overIsStatus) {
        const overIndex = toArr.indexOf(overId);
        const insertIndex = overIndex >= 0 ? overIndex : toArr.length;
        toArr.splice(insertIndex, 0, activeId);
      } else {
        toArr.push(activeId);
      }

      next[fromStatusId] = fromArr;
      next[toStatusId] = toArr;

      // also update lead status locally for UI
      setLeadById((lb) => ({
        ...lb,
        [activeId]: { ...lb[activeId], status_id: toStatusId },
      }));

      return next;
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = String(active.id);
    setActiveLeadId(null);

    if (!over) return;

    const overId = String(over.id);
    const overIsStatus = statusOrder.includes(overId);

    // final from/to
    const fromStatusId = findStatusIdByLeadId(activeId);
    if (!fromStatusId) return;

    const toStatusId = overIsStatus ? overId : findStatusIdByLeadId(overId);
    if (!toStatusId) return;

    // same column reorder
    if (fromStatusId === toStatusId && !overIsStatus) {
      const ids = idsByStatus[fromStatusId] ?? [];
      const oldIndex = ids.indexOf(activeId);
      const newIndex = ids.indexOf(overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newIds = arrayMove(ids, oldIndex, newIndex);
        setIdsByStatus((prev) => ({ ...prev, [fromStatusId]: newIds }));

        // ✅ action expects order arrays
        try {
          await moveLeadAction({
            fromStatusId,
            toStatusId,
            fromOrderIds: newIds,
            toOrderIds: newIds,
          });
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    // cross column: persist orders for both lists
    const finalFrom = idsByStatus[fromStatusId] ?? [];
    const finalTo = idsByStatus[toStatusId] ?? [];

    try {
      await moveLeadAction({
        fromStatusId,
        toStatusId,
        fromOrderIds: finalFrom,
        toOrderIds: finalTo,
      });
    } catch (e) {
      console.error(e);
    }
  }

  /* ---------------- Render ---------------- */
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="mt-5">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statuses.map((status) => {
            const ids = idsByStatus[status.id] ?? [];
            return (
              <div
                key={status.id}
                // droppable id = status.id (so you can drop into empty column)
                id={status.id}
                className="min-w-[280px] max-w-[320px] flex-shrink-0 rounded-2xl border border-zinc-200 bg-white p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: status.color ?? "#2563eb" }}
                    />
                    <div className="font-semibold text-zinc-900">{status.label}</div>
                  </div>
                  <div className="text-xs font-medium text-zinc-500 rounded-full border border-zinc-200 px-2 py-0.5">
                    {ids.length}
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-2">
                  <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {ids.length === 0 ? (
                        <div className="py-8 text-center text-xs text-zinc-500">
                          Drop leads here
                        </div>
                      ) : (
                        ids.map((leadId) => {
                          const lead = leadById[leadId];
                          if (!lead) return null;
                          return (
                            <SortableLeadCard
                              key={leadId}
                              lead={lead}
                              statusId={status.id}
                            />
                          );
                        })
                      )}
                    </div>
                  </SortableContext>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ✅ Drag Overlay = stable drag (no auto-drop feeling) */}
      <DragOverlay>
        {activeLead ? (
          <div className="w-[300px]">
            <LeadCard lead={activeLead} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
