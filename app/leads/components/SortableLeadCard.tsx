"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import LeadCard from "./LeadCard";
import type { Lead } from "./Board";

export default function SortableLeadCard({ lead }: { lead: Lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: { type: "lead", lead },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  // ✅ handleProps = sirf handle area pe apply hongay
  const handleProps = {
    ...attributes,
    ...listeners,
    style: {
      touchAction: "none", // ✅ mobile drag fix
      cursor: "grab",
    } as React.CSSProperties,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LeadCard lead={lead} handleProps={handleProps} />
    </div>
  );
}
