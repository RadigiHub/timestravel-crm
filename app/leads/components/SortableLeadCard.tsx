"use client";

import * as React from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import type { Lead } from "../types";
import LeadCard from "./LeadCard";

type Props = {
  lead: Lead;
};

export default function SortableLeadCard({ lead }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LeadCard
        lead={lead}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{
          ...attributes,
          ...listeners,
          style: { touchAction: "none" },
        }}
      />
    </div>
  );
}
