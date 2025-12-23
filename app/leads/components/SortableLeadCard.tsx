// app/leads/components/SortableLeadCard.tsx
"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Lead } from "../types";
import LeadCard from "./LeadCard";

export default function SortableLeadCard({ lead }: { lead: Lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LeadCard
        lead={lead}
        dragHandleProps={{
          ...attributes,
          ...listeners,
          style: {
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          },
        }}
      />
    </div>
  );
}
