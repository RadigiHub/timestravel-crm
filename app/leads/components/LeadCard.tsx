"use client";

import React from "react";
import type { Lead } from "../types";

type Props = {
  lead: Lead;
  isOverlay?: boolean;
  // When rendered inside SortableLeadCard, we pass handle props
  handleAttributes?: React.HTMLAttributes<HTMLButtonElement>;
  handleListeners?: Record<string, any>;
};

export default function LeadCard({
  lead,
  isOverlay,
  handleAttributes,
  handleListeners,
}: Props) {
  return (
    <div
      className={`rounded-2xl border bg-white p-3 shadow-sm ${
        isOverlay ? "border-zinc-300" : "border-zinc-200"
      }`}
    >
      {/* DRAG HANDLE (only this area drags) */}
      <button
        type="button"
        {...handleAttributes}
        {...handleListeners}
        style={{
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
        className="mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
        aria-label="Drag lead"
        title="Drag"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-zinc-300" />
        <span>Drag</span>
      </button>

      <div className="space-y-1">
        <div className="text-sm font-semibold text-zinc-900">
          {lead.full_name ?? "—"}
        </div>

        <div className="text-xs text-zinc-600">
          {lead.phone ?? "No phone"}
        </div>

        <div className="text-xs text-zinc-600">
          {lead.email ?? "No email"}
        </div>

        {lead.source ? (
          <div className="text-xs text-zinc-500">Source: {lead.source}</div>
        ) : null}
      </div>

      {/* Buttons safe (no drag listeners here) */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-50"
        >
          View
        </button>
        <button
          type="button"
          className="rounded-lg bg-black px-3 py-1 text-xs font-medium text-white hover:opacity-90"
        >
          Action
        </button>
      </div>
    </div>
  );
}
