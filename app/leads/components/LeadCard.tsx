// app/leads/components/LeadCard.tsx
"use client";

import React from "react";
import type { Lead } from "../types";

type DragHandleProps = React.HTMLAttributes<HTMLButtonElement>;

export default function LeadCard({
  lead,
  dragHandleProps,
}: {
  lead: Lead;
  dragHandleProps?: DragHandleProps;
}) {
  const priorityLabel = (lead.priority ?? "").toString().toUpperCase();

  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      {/* DRAG HANDLE (only this area drags) */}
      <button
        type="button"
        {...dragHandleProps}
        className="mb-2 flex w-full items-center justify-between rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
        style={{
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
        aria-label="Drag lead"
        title="Drag"
      >
        <span className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
          Drag
        </span>
        {priorityLabel ? (
          <span className="rounded-full border px-2 py-0.5 text-[10px]">
            {priorityLabel}
          </span>
        ) : null}
      </button>

      {/* CONTENT */}
      <div className="space-y-2">
        <div className="font-semibold">{lead.full_name}</div>

        <div className="text-xs text-gray-600 space-y-1">
          {lead.phone ? <div>📞 {lead.phone}</div> : null}
          {lead.email ? <div>✉️ {lead.email}</div> : null}
        </div>

        {(lead.from || lead.to) && (
          <div className="rounded-lg bg-gray-50 p-2 text-xs">
            <div className="font-medium">
              {lead.from ?? "—"} → {lead.to ?? "—"}
            </div>
            <div className="mt-1 text-gray-600">
              {lead.trip_type ?? ""}{" "}
              {lead.cabin ? `• ${lead.cabin}` : ""}{" "}
              {lead.budget ? `• Budget: ${lead.budget}` : ""}
            </div>
          </div>
        )}

        {lead.follow_up_date ? (
          <div className="text-xs text-gray-600">
            ⏰ Follow-up: {lead.follow_up_date}
          </div>
        ) : null}

        {lead.notes ? (
          <div className="text-xs text-gray-700">
            <span className="font-medium">Notes:</span> {lead.notes}
          </div>
        ) : null}

        {/* Actions (safe - no dragging here) */}
        <div className="mt-2 flex flex-wrap gap-2">
          {lead.phone ? (
            <a
              className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50"
              href={`tel:${lead.phone}`}
            >
              Call
            </a>
          ) : null}

          {lead.whatsapp ? (
            <a
              className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50"
              href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}${
                lead.whatsapp_text
                  ? `?text=${encodeURIComponent(lead.whatsapp_text)}`
                  : ""
              }`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
