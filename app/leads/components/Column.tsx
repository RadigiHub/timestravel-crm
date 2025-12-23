"use client";

import React from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

import SortableLeadCard from "./SortableLeadCard";
import type { Lead, LeadStatus } from "../types";

type Props = {
  status: LeadStatus;
  leads: Lead[];
};

export default function Column({ status, leads }: Props) {
  // droppable id for column
  const droppableId = `column:${status.id}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const ids = leads.map((l) => l.id);

  return (
    <div className="min-w-[340px] max-w-[340px] rounded-2xl border bg-white/40 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold">{status.name}</div>
        <div className="text-xs text-gray-500">{leads.length}</div>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "rounded-xl border border-dashed p-2",
          "min-h-[140px] space-y-2",
          isOver ? "bg-black/5" : "bg-white",
        ].join(" ")}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {leads.map((l) => (
            <SortableLeadCard key={l.id} lead={l} />
          ))}
        </SortableContext>

        {leads.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">
            Drop leads here
          </div>
        ) : null}
      </div>
    </div>
  );
}
