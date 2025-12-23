"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import type { Lead, LeadStatus } from "../types";
import SortableLeadCard from "./SortableLeadCard";

type Props = {
  status: LeadStatus;
  leads: Lead[];
  orderedIds: string[];
};

export default function Column({ status, leads, orderedIds }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: { type: "column", statusId: status.id },
  });

  const leadsById = React.useMemo(() => {
    const m: Record<string, Lead> = {};
    for (const l of leads) m[l.id] = l;
    return m;
  }, [leads]);

  const title = status.name ?? status.id;

  return (
    <div className="min-w-[320px] rounded-2xl border bg-gray-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600">
          {orderedIds.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[520px] rounded-xl border bg-white p-2 ${
          isOver ? "ring-2 ring-black/10" : ""
        }`}
      >
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderedIds.map((id) => {
              const lead = leadsById[id];
              if (!lead) return null;
              return <SortableLeadCard key={id} lead={lead} statusId={status.id} />;
            })}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
