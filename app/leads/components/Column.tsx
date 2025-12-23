// app/leads/components/Column.tsx
"use client";

import React from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Lead, LeadStatus } from "../types";
import SortableLeadCard from "./SortableLeadCard";

export default function Column({
  status,
  leads,
  orderIds,
}: {
  status: LeadStatus;
  leads: Lead[];
  orderIds: string[];
}) {
  // Ensure rendering follows orderIds
  const map = new Map(leads.map((l) => [l.id, l]));
  const orderedLeads = orderIds.map((id) => map.get(id)).filter(Boolean) as Lead[];

  return (
    <div className="w-[360px] shrink-0 rounded-2xl border bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold">{status.name}</div>
        <div className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
          {orderedLeads.length}
        </div>
      </div>

      <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {orderedLeads.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-xs text-gray-500">
              Drop leads here
            </div>
          ) : (
            orderedLeads.map((l) => <SortableLeadCard key={l.id} lead={l} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}
