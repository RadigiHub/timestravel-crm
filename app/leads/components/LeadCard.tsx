"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  priority: "hot" | "warm" | "cold";
  source: string | null;
};

export default function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const badge =
    lead.priority === "hot"
      ? "bg-red-50 text-red-700 border-red-200"
      : lead.priority === "cold"
      ? "bg-zinc-50 text-zinc-700 border-zinc-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-zinc-900">{lead.full_name}</div>
        <span className={`rounded-full border px-2 py-0.5 text-xs ${badge}`}>
          {lead.priority.toUpperCase()}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-xs text-zinc-600">
        {lead.phone ? <div>📞 {lead.phone}</div> : null}
        {lead.email ? <div>✉️ {lead.email}</div> : null}
        {lead.source ? <div>🔗 {lead.source}</div> : null}
      </div>
    </div>
  );
}
