"use client";

import * as React from "react";

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
  created_at: string;
  updated_at: string;
};

function safeText(v: string | null | undefined) {
  return v && v.trim().length ? v : "—";
}

export default function LeadCard({
  lead,
  onView,
  onAction,
  dragHandleProps,
}: {
  lead: Lead;
  onView: (lead: Lead) => void;
  onAction: (lead: Lead, anchorEl: HTMLButtonElement) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      {/* Drag handle (ONLY this is draggable) */}
      <button
        type="button"
        {...dragHandleProps}
        className="mb-2 inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "none",
          cursor: "grab",
        }}
        onClick={(e) => {
          // IMPORTANT: prevent DnD from treating click as drag
          e.stopPropagation();
        }}
      >
        <span className="inline-block h-2 w-2 rounded-full bg-zinc-300" />
        Drag
      </button>

      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-zinc-900">{safeText(lead.full_name)}</div>
          <span className="rounded-full border px-2 py-0.5 text-xs capitalize text-zinc-600">
            {lead.priority}
          </span>
        </div>

        <div className="text-xs text-zinc-600">{safeText(lead.phone)}</div>
        <div className="text-xs text-zinc-600">{safeText(lead.email)}</div>
        <div className="text-xs text-zinc-500">Source: {safeText(lead.source)}</div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
          onClick={(e) => {
            e.stopPropagation();
            onView(lead);
          }}
        >
          View
        </button>

        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
          onClick={(e) => {
            e.stopPropagation();
            onAction(lead, e.currentTarget);
          }}
        >
          Action
        </button>
      </div>
    </div>
  );
}
