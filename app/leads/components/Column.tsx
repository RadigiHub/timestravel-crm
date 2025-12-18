"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import LeadCard from "./LeadCard";

type Status = { id: string; label: string; color?: string | null };
type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  priority: "hot" | "warm" | "cold";
  source: string | null;
  status_id: string;
};

export default function Column({
  status,
  leads,
}: {
  status: Status;
  leads: Lead[];
}) {
  return (
    <div className="w-[320px] shrink-0 rounded-2xl border border-zinc-200 bg-zinc-100/60 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: status.color || "#111" }}
          />
          <div className="font-semibold text-zinc-900">{status.label}</div>
        </div>
        <div className="rounded-full bg-white px-2 py-0.5 text-xs text-zinc-600 border border-zinc-200">
          {leads.length}
        </div>
      </div>

      <SortableContext
        items={leads.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[60px]">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
