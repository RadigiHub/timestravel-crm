"use client";

import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import Column from "./Column";
import AddLeadForm from "./AddLeadForm";
import { moveLeadAction } from "../actions";

type Status = {
  id: string;
  label: string;
  position: number;
  color?: string | null;
};

type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status_id: string;
  position: number;
  priority: "hot" | "warm" | "cold";

  // (optional) new fields — Board ko zaroorat nahi, but types safe rehte
  departure?: string | null;
  destination?: string | null;
  depart_date?: string | null;
  return_date?: string | null;
};

function groupByStatus(statuses: Status[], leads: Lead[]) {
  const map: Record<string, Lead[]> = {};
  statuses.forEach((s) => (map[s.id] = []));
  leads.forEach((l) => {
    if (!map[l.status_id]) map[l.status_id] = [];
    map[l.status_id].push(l);
  });
  Object.keys(map).forEach((k) => {
    map[k] = map[k].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  });
  return map;
}

export default function Board({
  statuses,
  initialLeads,
}: {
  statuses: Status[];
  initialLeads: Lead[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [byStatus, setByStatus] = useState(() =>
    groupByStatus(statuses, initialLeads)
  );

  const statusIds = useMemo(() => new Set(statuses.map((s) => s.id)), [statuses]);

  const leadToStatus = useMemo(() => {
    const m: Record<string, string> = {};
    Object.entries(byStatus).forEach(([sid, leads]) => {
      leads.forEach((l) => (m[l.id] = sid));
    });
    return m;
  }, [byStatus]);

  function findContainerByLeadId(leadId: string) {
    return leadToStatus[leadId];
  }

  function findIndex(statusId: string, leadId: string) {
    return byStatus[statusId]?.findIndex((l) => l.id === leadId) ?? -1;
  }

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const activeLeadId = String(active.id);
    const overId = String(over.id);

    const fromStatus = findContainerByLeadId(activeLeadId);
    if (!fromStatus) return;

    // ✅ allow dropping on column itself (overId might be a statusId)
    const toStatus = statusIds.has(overId)
      ? overId
      : findContainerByLeadId(overId) || fromStatus;

    if (!toStatus) return;

    // SAME COLUMN reorder
    if (fromStatus === toStatus) {
      const oldIndex = findIndex(fromStatus, activeLeadId);

      // if dropped on column itself, move to end
      const newIndex = statusIds.has(overId)
        ? (byStatus[toStatus]?.length ?? 0) - 1
        : findIndex(toStatus, overId);

      if (oldIndex === -1) return;
      if (newIndex === -1 || oldIndex === newIndex) return;

      setByStatus((prev) => ({
        ...prev,
        [fromStatus]: arrayMove(prev[fromStatus], oldIndex, newIndex).map(
          (l, idx) => ({ ...l, position: idx })
        ),
      }));

      await moveLeadAction({
        leadId: activeLeadId,
        toStatusId: toStatus,
        toIndex: newIndex,
      });
      return;
    }

    // CROSS COLUMN move
    const fromList = [...(byStatus[fromStatus] || [])];
    const toList = [...(byStatus[toStatus] || [])];

    const movingIndex = fromList.findIndex((l) => l.id === activeLeadId);
    if (movingIndex === -1) return;

    const movingLead = { ...fromList[movingIndex], status_id: toStatus };
    fromList.splice(movingIndex, 1);

    // if dropped on a lead -> insert before it
    // if dropped on column -> insert at end
    const insertAt = statusIds.has(overId)
      ? toList.length
      : toList.findIndex((l) => l.id === overId);

    const targetIndex = insertAt === -1 ? toList.length : insertAt;
    toList.splice(targetIndex, 0, movingLead);

    const normalize = (arr: Lead[]) => arr.map((l, idx) => ({ ...l, position: idx }));

    setByStatus((prev) => ({
      ...prev,
      [fromStatus]: normalize(fromList),
      [toStatus]: normalize(toList),
    }));

    await moveLeadAction({
      leadId: activeLeadId,
      toStatusId: toStatus,
      toIndex: targetIndex,
    });
  };

  return (
    <div>
      <AddLeadForm />

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statuses.map((s) => (
            <Column key={s.id} status={s} leads={byStatus[s.id] || []} />
          ))}
        </div>
      </DndContext>

      {activeId ? (
        <div className="mt-2 text-xs text-zinc-500">
          Dragging: <span className="font-semibold">{activeId}</span>
        </div>
      ) : null}
    </div>
  );
}
