"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";

import type { Lead, LeadStatus } from "../types";
import Column from "./Column";
import SortableLeadCard from "./SortableLeadCard";
import { moveLeadAction } from "../actions";

type Props = {
  statuses: LeadStatus[];
  initialLeads: Lead[];
};

type OrderByStatus = Record<string, string[]>;

function safeStatusId(statusId: string | null | undefined) {
  return statusId ?? "new";
}

export default function Board({ statuses, initialLeads }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  const [activeId, setActiveId] = React.useState<string | null>(null);

  const [leads, setLeads] = React.useState<Lead[]>(() => initialLeads ?? []);
  const [orderByStatus, setOrderByStatus] = React.useState<OrderByStatus>(() => {
    const next: OrderByStatus = {};
    for (const s of statuses ?? []) next[s.id] = [];
    for (const l of initialLeads ?? []) {
      const sid = safeStatusId(l.status_id);
      if (!next[sid]) next[sid] = [];
      next[sid].push(l.id);
    }
    return next;
  });

  // keep state synced if server sends new lists
  React.useEffect(() => {
    setLeads(initialLeads ?? []);
    const next: OrderByStatus = {};
    for (const s of statuses ?? []) next[s.id] = [];
    for (const l of initialLeads ?? []) {
      const sid = safeStatusId(l.status_id);
      if (!next[sid]) next[sid] = [];
      next[sid].push(l.id);
    }
    setOrderByStatus(next);
  }, [initialLeads, statuses]);

  const leadsById = React.useMemo(() => {
    const m: Record<string, Lead> = {};
    for (const l of leads) m[l.id] = l;
    return m;
  }, [leads]);

  const findContainer = React.useCallback(
    (id: string) => {
      // if id is a column id
      if (orderByStatus[id]) return id;

      // else search which column has this lead id
      for (const key of Object.keys(orderByStatus)) {
        if (orderByStatus[key].includes(id)) return key;
      }
      return null;
    },
    [orderByStatus]
  );

  const onDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveId(id);
  };

  const onDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id;
    if (!overId) return;

    const active = String(event.active.id);
    const over = String(overId);

    const activeContainer = findContainer(active);
    const overContainer = findContainer(over);

    if (!activeContainer || !overContainer) return;
    if (activeContainer === overContainer) return;

    setOrderByStatus((prev) => {
      const next = { ...prev };
      const from = [...(next[activeContainer] ?? [])];
      const to = [...(next[overContainer] ?? [])];

      const fromIndex = from.indexOf(active);
      if (fromIndex >= 0) from.splice(fromIndex, 1);

      // if hovering a card in another column, insert before it, else push end
      const overIndex = to.indexOf(over);
      if (overIndex >= 0) to.splice(overIndex, 0, active);
      else to.push(active);

      next[activeContainer] = from;
      next[overContainer] = to;
      return next;
    });
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const overId = event.over?.id;
    const active = String(event.active.id);
    setActiveId(null);

    if (!overId) return;

    const over = String(overId);
    const fromStatusId = findContainer(active);
    const toStatusId = findContainer(over);

    if (!fromStatusId || !toStatusId) return;

    // If dropped on same column but not re-ordered, still ok
    // We will just persist order + status move
    const fromOrderIds = orderByStatus[fromStatusId] ?? [];
    const toOrderIds = orderByStatus[toStatusId] ?? [];

    // Update local lead status (so UI reflects)
    setLeads((prev) =>
      prev.map((l) =>
        l.id === active ? { ...l, status_id: toStatusId } : l
      )
    );

    // Persist to server (your action expects only these fields)
    try {
      await moveLeadAction({
        fromStatusId,
        toStatusId,
        fromOrderIds,
        toOrderIds,
      });
    } catch (e) {
      // If server fails, you can optionally refetch server data
      console.error("moveLeadAction failed", e);
    }
  };

  const activeLead = activeId ? leadsById[activeId] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {(statuses ?? []).map((s) => {
          const sid = s.id;
          const ids = orderByStatus[sid] ?? [];

          // get leads for this column by ids (keeps UI consistent)
          const columnLeads = ids
            .map((id) => leadsById[id])
            .filter(Boolean) as Lead[];

          return (
            <Column
              key={sid}
              status={s}
              leads={columnLeads}
              orderedIds={ids}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="w-[320px]">
            <SortableLeadCard lead={activeLead} statusId={safeStatusId(activeLead.status_id)} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
