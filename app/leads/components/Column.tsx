"use client";

import * as React from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableLeadCard from "./SortableLeadCard";

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
  created_at: string;
  updated_at: string;
};

export default function Column({
  status,
  leadIds,
  leadsById,
  onView,
  onAction,
}: {
  status: Status;
  leadIds: string[];
  leadsById: Record<string, Lead>;
  onView: (lead: Lead) => void;
  onAction: (lead: Lead, anchorEl: HTMLButtonElement) => void;
}) {
  return (
    <div className="w-[340px] shrink-0 rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="font-semibold text-zinc-900">{status.label}</div>
        <div className="text-sm text-zinc-500">{leadIds.length}</div>
      </div>

      <div className="p-3">
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {leadIds.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-sm text-zinc-500">
                No leads
              </div>
            ) : (
              leadIds.map((id) => {
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
              })
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
