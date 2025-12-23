"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  MeasuringStrategy,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import Column from "./Column";
import SortableLeadCard from "./SortableLeadCard";
import LeadCard from "./LeadCard";

import type { Lead, LeadStatus } from "../types";
import { moveLeadAction } from "../actions";

/**
 * Board expects:
 * - statuses: LeadStatus[]
 * - leads: Lead[]   (can come raw from DB; we'll normalize)
 */
type Props = {
  statuses: LeadStatus[];
  leads: Lead[];
};

function normalizeLead(l: any): Lead {
  return {
    id: String(l.id),
    full_name: String(l.full_name ?? ""),
    phone: l.phone ?? null,
    email: l.email ?? null,
    source: l.source ?? null,
    status_id: String(l.status_id ?? "new"),
    assigned_to: l.assigned_to ?? null,
    created_at: l.created_at,
    updated_at: l.updated_at,
    whatsapp_text: l.whatsapp_text ?? null,
  };
}

export default function Board({ statuses, leads }: Props) {
  const normalizedLeads = useMemo(() => leads.map(normalizeLead), [leads]);

  // Map for quick lookup
  const leadById = useMemo(() => {
    const m = new Map<string, Lead>();
    for (const l of normalizedLeads) m.set(l.id, l);
    return m;
  }, [normalizedLeads]);

  /**
   * orderByStatus keeps lead ids order per column.
   * { [statusId]: string[] }
   */
  const [orderByStatus, setOrderByStatus] = useState<Record<string, string[]>>(
    {}
  );

  // Initial order setup (when leads/statuses change)
  useEffect(() => {
    const next: Record<string, string[]> = {};
    for (const s of statuses) next[s.id] = [];
    for (const l of normalizedLeads) {
      if (!next[l.status_id]) next[l.status_id] = [];
      next[l.status_id].push(l.id);
    }
    setOrderByStatus(next);
  }, [statuses, normalizedLeads]);

  const leadsByStatus = useMemo(() => {
    const result: Record<string, Lead[]> = {};
    for (const s of statuses) result[s.id] = [];

    for (const [statusId, ids] of Object.entries(orderByStatus)) {
      result[statusId] = ids
        .map((id) => leadById.get(id))
        .filter(Boolean) as Lead[];
    }
    return result;
  }, [orderByStatus, leadById, statuses]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeLead = activeId ? leadById.get(activeId) : null;

  // ✅ Most important: sensors + activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function findStatusIdByLeadId(leadId: string): string | null {
    for (const [statusId, ids] of Object.entries(orderByStatus)) {
      if (ids.includes(leadId)) return statusId;
    }
    return null;
  }

  function onDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setActiveId(id);
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLeadId = String(active.id);
    const overId = String(over.id);

    const fromStatusId = findStatusIdByLeadId(activeLeadId);
    if (!fromStatusId) return;

    // Over can be a lead OR a column dropzone.
    // We'll encode column droppable ids as `column:<statusId>` in Column.tsx
    let toStatusId: string | null = null;

    if (overId.startsWith("column:")) {
      toStatusId = overId.replace("column:", "");
    } else {
      // over is another lead id
      toStatusId = findStatusIdByLeadId(overId);
    }

    if (!toStatusId) return;

    setOrderByStatus((prev) => {
      const next = structuredClone(prev) as Record<string, string[]>;
      const fromIds = [...(next[fromStatusId] ?? [])];
      const toIds =
        fromStatusId === toStatusId
          ? fromIds
          : [...(next[toStatusId] ?? [])];

      const fromIndex = fromIds.indexOf(activeLeadId);
      if (fromIndex === -1) return prev;

      // remove from source
      fromIds.splice(fromIndex, 1);

      // decide insert index
      let newIndex = toIds.length; // default end
      if (!overId.startsWith("column:")) {
        const overIndex = toIds.indexOf(overId);
        if (overIndex !== -1) newIndex = overIndex;
      }

      // insert into destination
      toIds.splice(newIndex, 0, activeLeadId);

      // write back
      next[fromStatusId] = fromIds;
      next[toStatusId] = toIds;

      // ✅ Persist with correct action signature (NO leadId)
      // Important: use try/catch but do not break UI
      (async () => {
        try {
          await moveLeadAction({
            fromStatusId,
            toStatusId,
            fromOrderIds: fromIds,
            toOrderIds: toIds,
          });
        } catch (e) {
          console.error("moveLeadAction failed", e);
        }
      })();

      return next;
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((s) => (
          <Column
            key={s.id}
            status={s}
            leads={leadsByStatus[s.id] ?? []}
          />
        ))}
      </div>

      {/* ✅ DragOverlay prevents “auto drop / jitter” and feels smooth */}
      <DragOverlay dropAnimation={null}>
        {activeLead ? (
          <div className="w-[320px]">
            <LeadCard lead={activeLead} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
