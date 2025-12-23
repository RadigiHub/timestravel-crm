"use client";

import * as React from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Lead, LeadStatus } from "../types";
import SortableLeadCard from "./SortableLeadCard";

type Props = {
  status: LeadStatus;
  leads: Lead[];
};

export default function Column({ status, leads }: Props) {
  const ids = React.useMemo(() => leads.map((l) => l.id), [leads]);

  return (
    <div className="w-80 shrink-0 rounded-xl border bg-gray-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">{status.name}</div>
        <div className="text-xs text-gray-500">{leads.length}</div>
      </div>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {leads.length === 0 ? (
            <div className="rounded-md border border-dashed bg-white p-3 text-center text-xs text-gray-500">
              Drop leads here
            </div>
          ) : (
            leads.map((l) => <SortableLeadCard key={l.id} lead={l} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}
