"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import LeadCard from "./LeadCard";

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

  trip_type?: string | null;
  from_city?: string | null;
  to_city?: string | null;
  depart_date?: string | null;
  return_date?: string | null;
  cabin?: string | null;
  budget?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  whatsapp?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
};

export default function SortableLeadCard({ lead }: { lead: Lead }) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // IMPORTANT for touch drag
    touchAction: "none",
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* We pass dragHandle props to LeadCard handle area ONLY */}
      <LeadCard lead={lead} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}
