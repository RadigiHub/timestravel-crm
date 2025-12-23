"use client";

import * as React from "react";
import type { Lead } from "../types";

type Props = {
  lead: Lead;

  /**
   * Drag handle props injected by SortableLeadCard
   * so ONLY handle drags, not buttons/links.
   */
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  dragHandleRef?: (node: HTMLButtonElement | null) => void;
};

export default function LeadCard({ lead, dragHandleProps, dragHandleRef }: Props) {
  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      {/* Drag Handle (safe area) */}
      <button
        ref={dragHandleRef}
        type="button"
        {...dragHandleProps}
        style={{
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
        className="mb-2 flex items-center gap-2 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
        aria-label="Drag lead"
        title="Drag"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
        <span>Drag</span>
      </button>

      {/* Card Content */}
      <div className="space-y-1">
        <div className="text-sm font-semibold text-gray-900">{lead?.name ?? "Unnamed Lead"}</div>

        <div className="text-xs text-gray-600">
          {lead?.phone ? `📞 ${lead.phone}` : "📞 —"}
        </div>

        {lead?.email ? <div className="text-xs text-gray-600">✉️ {lead.email}</div> : null}

        {lead?.whatsapp_text ? (
          <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-700">
            {lead.whatsapp_text}
          </div>
        ) : null}
      </div>

      {/* Buttons area (drag won't trigger from here) */}
      <div className="mt-3 flex gap-2">
        <button className="rounded-md bg-black px-3 py-1 text-xs text-white">
          View
        </button>
        <button className="rounded-md border px-3 py-1 text-xs">
          Call
        </button>
      </div>
    </div>
  );
}
