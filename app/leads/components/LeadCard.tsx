"use client";

import React from "react";
import type { Lead } from "../types";

type DragHandleProps = {
  ref: (node: HTMLElement | null) => void;
  attributes: Record<string, any>;
  listeners: Record<string, any>;
};

type Props = {
  lead: Lead;
  dragging?: boolean;
  dragHandle?: DragHandleProps;
};

export default function LeadCard({ lead, dragging, dragHandle }: Props) {
  return (
    <div
      className={[
        "rounded-xl border bg-white shadow-sm",
        "p-3",
        dragging ? "ring-2 ring-black/10" : "",
      ].join(" ")}
    >
      {/* ✅ Drag Handle (safe area) */}
      <div
        className="mb-2 flex items-center justify-between gap-2"
        style={{ touchAction: "none" }}
      >
        <div
          className="flex items-center gap-2"
          {...(dragHandle?.attributes ?? {})}
          {...(dragHandle?.listeners ?? {})}
          ref={dragHandle?.ref as any}
          style={{
            cursor: "grab",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
          <span>Drag</span>
        </div>

        {/* right side small meta */}
        <div className="text-xs text-gray-400">ID: {lead.id.slice(0, 5)}</div>
      </div>

      {/* Content */}
      <div className="font-semibold text-sm">{lead.full_name}</div>

      <div className="mt-1 space-y-1 text-sm text-gray-600">
        {lead.phone ? <div>📞 {lead.phone}</div> : null}
        {lead.email ? <div>✉️ {lead.email}</div> : null}
        {lead.source ? <div className="text-xs text-gray-400">Source: {lead.source}</div> : null}
      </div>

      {/* Actions (safe - not draggable) */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
          onClick={() => {
            if (!lead.phone) return;
            window.open(`tel:${lead.phone}`, "_self");
          }}
        >
          Call
        </button>

        <button
          type="button"
          className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
          onClick={() => {
            const wa = lead.phone?.replace(/[^\d+]/g, "") ?? "";
            if (!wa) return;
            window.open(`https://wa.me/${wa}`, "_blank");
          }}
        >
          WhatsApp
        </button>
      </div>
    </div>
  );
}
