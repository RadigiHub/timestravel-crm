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
import AddLeadModal from "./AddLeadModal";

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
  const [openAdd, setOpenAdd] = useState(false);

  const [byStatus, setByStatus] = useState(() =>
    groupByStatus(statuses, initialLeads)
  );

  const leadToStatus = useMemo(() => {
    const m: Record<string, string> = {};
    Object.entries(byStatus).forEach(([sid, leads]) => {
      leads.forEach((l) => (m[l.id] = sid));
    });
    return m;
  }, [byStatus]);

  function findContainer(leadId: string) {
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

    const fromStatus = findContainer(activeLeadId);
    const toStatus = leadToStatus[overId] || fromStatus;

    if (!fromStatus || !toStatus) return;

    // same column reorder
    if (fromStatus === toStatus) {
      const oldIndex = findIndex(fromStatus, activeLeadId);
      const newIndex = findIndex(toStatus, overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      setByStatus((prev) => ({
        ...prev,
        [fromStatus]: arrayMove(prev[fromStatus], oldIndex, newIndex).map(
          (l, idx) => ({ ...l, position: idx })
        ),
      }));
      return;
    }

    // cross column move
    const fromList = [...(byStatus[fromStatus] || [])];
    const toList = [...(byStatus[toStatus] || [])];

    const movingIndex = fromList.findIndex((l) => l.id === activeLeadId);
    if (movingIndex === -1) return;

    const movingLead = { ...fromList[movingIndex], status_id: toStatus };
    fromList.splice(movingIndex, 1);

    // if dropped on a column itself (empty), append
    const insertAt = toList.findIndex((l) => l.id === overId);
    const targetIndex = insertAt === -1 ? toList.length : insertAt;

    toList.splice(targetIndex, 0, movingLead);

    const normalize = (arr: Lead[]) =>
      arr.map((l, idx) => ({ ...l, position: idx }));

    setByStatus((prev) => ({
      ...prev,
      [fromStatus]: normalize(fromList),
      [toStatus]: normalize(toList),
    }));
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-zinc-900">Leads Board</div>
          <div className="text-sm text-zinc-500">
            Drag & drop leads across stages.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenAdd(true)}
            className="h-10 rounded-xl bg-black px-4 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            + Add Lead
          </button>
        </div>
      </div>

      {/* Board */}
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
        <div className="text-xs text-zinc-500">
          Dragging: <span className="font-semibold">{activeId}</span>
        </div>
      ) : null}

      {/* Modal */}
      <AddLeadModal open={openAdd} onClose={() => setOpenAdd(false)} />
    </div>
  );
}
