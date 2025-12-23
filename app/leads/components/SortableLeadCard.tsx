"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import LeadCard from "./LeadCard";
import type { Lead } from "../types";

type Props = {
  id: string;
  statusId: string;
  lead: Lead;
};

export default function SortableLeadCard({ id, statusId, lead }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { statusId }, // IMPORTANT: used in Board to know fromStatus
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LeadCard
        lead={lead}
        handleAttributes={attributes as any}
        handleListeners={listeners}
      />
    </div>
  );
}
