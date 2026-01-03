"use client";

import * as React from "react";
import type { Lead } from "../actions";

export default function LeadCard({
  lead,
  onView,
  onAction,
  dragHandleProps,
}: {
  lead: Lead;
  onView: (lead: Lead) => void;
  onAction: (lead: Lead, anchor: HTMLButtonElement) => void;
  dragHandleProps: any;
}) {
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="text-left"
          onClick={() => onView(lead)}
        >
          <div className="text-sm font-semibold text-zinc-900">
            {lead.full_name ?? "Unnamed Lead"}
          </div>
          <div className="mt-1 text-xs text-zinc-600">
            {lead.phone ?? lead.email ?? "No contact"}
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            {...dragHandleProps}
            className="cursor-grab rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 active:cursor-grabbing"
            aria-label="Drag"
          >
            ⋮⋮
          </button>

          <button
            ref={btnRef}
            type="button"
            onClick={() => {
              if (btnRef.current) onAction(lead, btnRef.current);
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
          >
            Action
          </button>
        </div>
      </div>

      {lead.notes ? (
        <div className="mt-2 line-clamp-2 text-xs text-zinc-600">{lead.notes}</div>
      ) : null}
    </div>
  );
}
