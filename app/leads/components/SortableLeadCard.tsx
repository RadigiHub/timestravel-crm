"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Lead } from "../types";
import LeadCard from "./LeadCard";

type Props = {
  lead: Lead;
  statusId: string;
};

export default function SortableLeadCard({ lead, statusId }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: { type: "lead", statusId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LeadCard lead={lead} dragHandleProps={{ attributes, listeners }} />
    </div>
  );
}
