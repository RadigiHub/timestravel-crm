"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import LeadCard from "./LeadCard";

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

  // optional travel fields (safe)
  trip_type?: "oneway" | "return" | "multicity" | null;
  departure?: string | null;
  destination?: string | null;
  depart_date?: string | null;
  return_date?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  cabin_class?: string | null;
  preferred_airline?: string | null;
  budget?: string | null;
  whatsapp?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

export default function Column({ status, leads }: { status: Status; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });

  return (
    <div
      ref={setNodeRef}
      className={`w-[320px] shrink-0 rounded-2xl border p-3 ${
        isOver ? "border-zinc-400 bg-zinc-100" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: status.color || "#111827" }}
          />
          <div className="text-sm font-semibold text-zinc-900">{status.label}</div>
        </div>

        <div className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600">
          {leads.length}
        </div>
      </div>

      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {leads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-xs text-zinc-500">
              Drop leads here
            </div>
          ) : (
            leads.map((l) => <LeadCard key={l.id} lead={l} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}
