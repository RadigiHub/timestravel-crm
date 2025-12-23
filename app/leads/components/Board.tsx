"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import type { Lead, LeadStatus } from "../types";
import { moveLeadAction } from "../actions";
import Column from "./Column";
import LeadCard from "./LeadCard";

type Props = {
  statuses: LeadStatus[];
  initialLeads: Lead[];
};

function normalizeLead(l: any): Lead {
  return {
    ...l,
    phone: l?.phone ?? null,
    whatsapp_text: l?.whatsapp_text ?? null,
    assigned_to: l?.assigned_to ?? null,
    created_at: l?.created_at ?? null,
    updated_at: l?.updated_at ?? null,
    status_id: l?.status_id ?? null,
  };
}

export default function Board({ statuses, initialLeads }: Props) {
  const [leads, setLeads] = React.useState<Lead[]>(() =>
    (initialLeads ?? []).map(normalizeLead)
  );

  // If some lead has null status_id, we put it into first column (so TS + UI don't break)
  const fallbackStatusId = statuses?.[0]?.id ?? null;

  const leadsByStatus = React.useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of statuses) map[s.id] = [];

    for (const raw of leads) {
      const l = normalizeLead(raw);
      const sid = l.status_id ?? fallbackStatusId;
      if (!sid) continue; // no statuses exist
      map[sid] = map[sid] ?? [];
      map[sid].push({ ...l, status_id: sid });
    }
    return map;
  }, [leads, statuses, fallbackStatusId]);

  // Order state (ids) per status
  const [orderByStatus, setOrderByStatus] = React.useState<Record<string, string[]>>({});

  React.useEffect(() => {
    const next: Record<string, string[]> = {};
    for (const s of statuses) next[s.id] = [];
    for (const s of statuses) {
      next[s.id] = (leadsByStatus[s.id] ?? []).map((l) => l.id);
    }
    setOrderByStatus(next);
  }, [statuses, leadsByStatus]);

  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Sensors: pointer + touch (with activation constraint so it doesn't "auto-drop")
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } })
  );

  const activeLead = React.useMemo(() => {
    if (!activeId) return null;
    return leads.find((l) => l.id === activeId) ?? null;
  }, [activeId, leads]);

  const findStatusOfLead = (leadId: string) => {
    for (const s of statuses) {
      const ids = orderByStatus[s.id] ?? [];
      if (ids.includes(leadId)) return s.id;
    }
    return null;
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);

    const fromStatusId = findStatusOfLead(draggedId);
    if (!fromStatusId) return;

    // If dropped on a lead card, use that lead’s status; otherwise if dropped on column, use column id.
    const toStatusId = statuses.some((s) => s.id === overId)
      ? overId
      : findStatusOfLead(overId) ?? fromStatusId;

    const fromIds = [...(orderByStatus[fromStatusId] ?? [])];
    const toIds = fromStatusId === toStatusId ? fromIds : [...(orderByStatus[toStatusId] ?? [])];

    const fromIndex = fromIds.indexOf(draggedId);
    if (fromIndex === -1) return;

    // remove from source
    fromIds.splice(fromIndex, 1);

    // insert into destination
    if (fromStatusId === toStatusId) {
      const overIndex = toIds.indexOf(overId);
      const newIndex = overIndex === -1 ? toIds.length : overIndex;
      const reordered = arrayMove(toIds, toIds.indexOf(draggedId), newIndex);
      setOrderByStatus((prev) => ({ ...prev, [toStatusId]: reordered }));
    } else {
      const overIndex = toIds.indexOf(overId);
      const insertIndex = overIndex === -1 ? toIds.length : overIndex;
      toIds.splice(insertIndex, 0, draggedId);

      setOrderByStatus((prev) => ({
        ...prev,
        [fromStatusId]: fromIds,
        [toStatusId]: toIds,
      }));

      // also update lead's status in state
      setLeads((prev) =>
        prev.map((l) => (l.id === draggedId ? { ...l, status_id: toStatusId } : l))
      );
    }

    // Persist to backend (your action expects these four arrays)
    try {
      await moveLeadAction({
        fromStatusId,
        toStatusId,
        fromOrderIds: fromIds,
        toOrderIds: toIds,
      });
    } catch (e) {
      console.error("moveLeadAction failed:", e);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-3">
        {statuses.map((s) => (
          <Column key={s.id} status={s} leads={leadsByStatus[s.id] ?? []} />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
