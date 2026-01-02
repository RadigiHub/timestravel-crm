"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableLeadCard from "./SortableLeadCard";
import type { Lead, LeadStatus } from "../actions";

export default function Column({
  status,
  leadIds,
  leadsById,
  onView,
  onAction,
}: {
  status: LeadStatus;
  leadIds: string[];
  leadsById: Record<string, Lead>;
  onView: (lead: Lead) => void;
  onAction: (lead: Lead, anchor: HTMLButtonElement) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status.id });

  return (
    <div className="min-w-[320px] max-w-[320px] rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900">{status.label}</div>
        <div className="text-xs text-zinc-500">{leadIds.length}</div>
      </div>

      <div
        ref={setNodeRef}
        className="min-h-[120px] rounded-xl border border-zinc-100 bg-zinc-50 p-2"
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {leadIds.map((id) => {
              const lead = leadsById[id];
              if (!lead) return null;
              return (
                <SortableLeadCard
                  key={id}
                  lead={lead}
                  onView={onView}
                  onAction={onAction}
                />
              );
            })}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
