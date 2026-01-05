"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import LeadCard from "./LeadCard";
import type { Lead } from "../actions";

export default function SortableLeadCard({
  lead,
  onAction,
}: {
  lead: Lead;
  onAction: (lead: Lead, anchor: HTMLButtonElement) => void;
}) {
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
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LeadCard
        lead={lead}
        onAction={onAction}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
