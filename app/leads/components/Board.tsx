"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
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

type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status_id: string;
  position: number;
  priority: "hot" | "warm" | "cold";
  assigned_to: string | null;
  created_at?: string;
  updated_at?: string;

  // Optional fields (agar aapke schema me hain)
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
  follow_up_date?: string | null;
  notes?: string | null;
};

type Props = {
  statuses: Status[];
  initialLeads: Lead[];
};

function getStatusIds(statuses: Status[]) {
  return statuses.map((s) => s.id);
}

function splitLeadsByStatus(leads: Lead[]) {
  const map = new Map<string, Lead[]>();
  for (const l of leads) {
    const arr = map.get(l.status_id) ?? [];
    arr.push(l);
    map.set(l.status_id, arr);
  }
  // sort each column by position (fallback: created_at)
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    map.set(k, arr);
  }
  return map;
}

function findContainerIdFromOverId(
  overId: string,
  statuses: Status[],
  leadsByStatus: Map<string, Lead[]>
) {
  // If overId is a status column id
  if (statuses.some((s) => s.id === overId)) return overId;

  // Else it is a lead id — find which status contains it
  for (const s of statuses) {
    const arr = leadsByStatus.get(s.id) ?? [];
    if (arr.some((l) => l.id === overId)) return s.id;
  }
  return null;
}

export default function Board({ statuses, initialLeads }: Props) {
  const statusIds = React.useMemo(() => getStatusIds(statuses), [statuses]);

  const [leadsByStatus, setLeadsByStatus] = React.useState<Map<string, Lead[]>>(
    () => splitLeadsByStatus(initialLeads)
  );

  // if server sends new leads, sync (optional)
  React.useEffect(() => {
    setLeadsByStatus(splitLeadsByStatus(initialLeads));
  }, [initialLeads]);

  const [activeLeadId, setActiveLeadId] = React.useState<string | null>(null);

  const activeLead = React.useMemo(() => {
    if (!activeLeadId) return null;
    for (const s of statuses) {
      const arr = leadsByStatus.get(s.id) ?? [];
      const found = arr.find((l) => l.id === activeLeadId);
      if (found) return found;
    }
    return null;
  }, [activeLeadId, leadsByStatus, statuses]);

  /* ---------------- Sensors (MOST IMPORTANT) ---------------- */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // mouse drag accidental click avoid
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 }, // mobile/touch accidental drop fix
    })
  );

  /* ---------------- Drag Handlers ---------------- */
  function onDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setActiveLeadId(id);
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLeadId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // find source container
    let fromStatusId: string | null = null;
    let activeLead: Lead | null = null;

    for (const s of statuses) {
      const arr = leadsByStatus.get(s.id) ?? [];
      const found = arr.find((l) => l.id === activeId);
      if (found) {
        fromStatusId = s.id;
        activeLead = found;
        break;
      }
    }
    if (!fromStatusId || !activeLead) return;

    const toStatusId = findContainerIdFromOverId(overId, statuses, leadsByStatus);
    if (!toStatusId) return;

    // If same column: reorder inside
    if (fromStatusId === toStatusId) {
      const column = [...(leadsByStatus.get(fromStatusId) ?? [])];
      const oldIndex = column.findIndex((l) => l.id === activeId);
      const newIndex = column.findIndex((l) => l.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const newColumn = arrayMove(column, oldIndex, newIndex).map((l, idx) => ({
        ...l,
        position: idx,
      }));

      // optimistic update
      setLeadsByStatus((prev) => {
        const next = new Map(prev);
        next.set(fromStatusId!, newColumn);
        return next;
      });

      // persist (server action)
      try {
        await moveLeadAction({
          leadId: activeId,
          toStatusId,
          toPosition: newIndex,
        });
      } catch (e) {
        // fallback: reload approach (simple)
        // you can also revert state here if you want
        console.error(e);
      }
      return;
    }

    // Move to another column
    const fromColumn = [...(leadsByStatus.get(fromStatusId) ?? [])];
    const toColumn = [...(leadsByStatus.get(toStatusId) ?? [])];

    const fromIndex = fromColumn.findIndex((l) => l.id === activeId);
    if (fromIndex === -1) return;

    // remove from source
    const [moving] = fromColumn.splice(fromIndex, 1);

    // insert position in target
    const overIsLeadInTarget = toColumn.some((l) => l.id === overId);
    const insertIndex = overIsLeadInTarget
      ? Math.max(0, toColumn.findIndex((l) => l.id === overId))
      : toColumn.length;

    toColumn.splice(insertIndex, 0, { ...moving, status_id: toStatusId });

    // re-index positions
    const newFromColumn = fromColumn.map((l, idx) => ({ ...l, position: idx }));
    const newToColumn = toColumn.map((l, idx) => ({ ...l, position: idx }));

    // optimistic update
    setLeadsByStatus((prev) => {
      const next = new Map(prev);
      next.set(fromStatusId!, newFromColumn);
      next.set(toStatusId, newToColumn);
      return next;
    });

    // persist
    try {
      await moveLeadAction({
        leadId: activeId,
        toStatusId,
        toPosition: insertIndex,
      });
    } catch (e) {
      console.error(e);
    }
  }

  /* ---------------- UI ---------------- */
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => {
          const items = leadsByStatus.get(status.id) ?? [];
          const ids = items.map((l) => l.id);

          return (
            <div
              key={status.id}
              id={status.id}
              className="min-w-[320px] max-w-[360px] rounded-2xl border border-zinc-200 bg-white p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: status.color ?? "#3b82f6" }}
                  />
                  <div className="text-sm font-semibold text-zinc-900">
                    {status.label}
                  </div>
                </div>
                <div className="text-xs text-zinc-500">{items.length}</div>
              </div>

              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-2">
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white text-xs text-zinc-400">
                        Drop leads here
                      </div>
                    ) : (
                      items.map((lead) => (
                        <SortableLeadCard key={lead.id} lead={lead} />
                      ))
                    )}
                  </div>
                </SortableContext>
              </div>
            </div>
          );
        })}
      </div>

      {/* DragOverlay (MOST IMPORTANT) */}
      <DragOverlay>
        {activeLead ? (
          <div className="w-[320px]">
            <LeadCard lead={activeLead} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
