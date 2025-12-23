"use client";

import React, { type Dispatch, type SetStateAction } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

import SortableLeadCard from "./SortableLeadCard";
import type { Lead, LeadStatus } from "../types";

type Props = {
  status: LeadStatus;
  leadIds: string[];
  leadsById: Map<string, Lead>;
};

export default function Column({ status, leadIds, leadsById }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id, // make whole column a drop target
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[320px] max-w-[360px] rounded-2xl border bg-white p-3 ${
        isOver ? "border-zinc-400" : "border-zinc-200"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-800">{status.label}</div>
        <div className="text-xs text-zinc-500">{leadIds.length}</div>
      </div>

      <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {leadIds.map((id) => {
            const lead = leadsById.get(id);
            if (!lead) return null;

            return (
              <SortableLeadCard
                key={id}
                id={id}
                statusId={status.id}
                lead={lead}
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
}
