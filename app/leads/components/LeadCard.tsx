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
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Drag handle ONLY */}
        <button
          type="button"
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
          {...dragHandleProps}
        >
          Drag
        </button>

        <div className="text-[11px] text-zinc-500 capitalize">
          {lead.priority ?? "warm"}
        </div>
      </div>

      <div className="mt-2">
        <div className="text-sm font-semibold text-zinc-900">
          {lead.full_name ?? "—"}
        </div>
        <div className="mt-1 space-y-0.5 text-xs text-zinc-600">
          {lead.phone ? <div>{lead.phone}</div> : null}
          {lead.email ? <div>{lead.email}</div> : null}
          <div>Source: {lead.source ?? "—"}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
          onClick={() => onView(lead)}
        >
          View
        </button>

        <button
          type="button"
          className="rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
          onClick={(e) => onAction(lead, e.currentTarget)}
        >
          Action
        </button>
      </div>
    </div>
  );
}
