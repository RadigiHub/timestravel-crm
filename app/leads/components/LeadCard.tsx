"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status_id: string;
  position: number;
  priority: "hot" | "warm" | "cold";
};

function priorityBadge(p: Lead["priority"]) {
  if (p === "hot") return "bg-red-100 text-red-700 border-red-200";
  if (p === "cold") return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
}

export default function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-zinc-200 bg-white p-3 shadow-sm ${
        isDragging ? "opacity-60" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-zinc-900">{lead.full_name}</div>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${priorityBadge(lead.priority)}`}>
          {lead.priority.toUpperCase()}
        </span>
      </div>

      <div className="mt-1 text-xs text-zinc-600 space-y-1">
        {lead.phone ? <div>📞 {lead.phone}</div> : null}
        {lead.email ? <div>✉️ {lead.email}</div> : null}
        {lead.source ? <div>🔎 {lead.source}</div> : null}
      </div>
    </div>
  );
}
