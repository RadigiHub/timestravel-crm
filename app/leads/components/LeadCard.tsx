"use client";

import * as React from "react";
import type { Lead } from "../types";

type DragHandleProps = {
  attributes: Record<string, any>;
  listeners: Record<string, any>;
};

export default function LeadCard({
  lead,
  dragHandleProps,
}: {
  lead: Lead;
  dragHandleProps?: DragHandleProps;
}) {
  const phone = lead.phone ?? "";
  const email = lead.email ?? "";
  const priority = (lead.priority ?? "Warm").toString().toUpperCase();

  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      {/* DRAG HANDLE (only this area drags) */}
      <div
        {...(dragHandleProps?.attributes ?? {})}
        {...(dragHandleProps?.listeners ?? {})}
        className="mb-2 flex items-center gap-2 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
        style={{
          cursor: "grab",
          touchAction: "none", // IMPORTANT for mobile/trackpad
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        aria-label="Drag lead"
        title="Drag"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
        <span>Drag</span>
      </div>

      {/* CONTENT */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold">{lead.full_name}</div>
          {phone ? (
            <div className="mt-1 text-sm text-gray-600">{phone}</div>
          ) : null}
          {email ? (
            <div className="mt-0.5 truncate text-sm text-gray-500">{email}</div>
          ) : null}
        </div>

        <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold">
          {priority}
        </span>
      </div>

      {/* NOTES */}
      {lead.notes ? (
        <div className="mt-2 line-clamp-2 text-sm text-gray-600">
          {lead.notes}
        </div>
      ) : null}

      {/* ACTIONS (safe - won't trigger drag) */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          onClick={() => {
            if (phone) window.open(`tel:${phone}`, "_self");
          }}
        >
          Call
        </button>

        <button
          type="button"
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          onClick={() => {
            const wa = lead.whatsapp ?? phone;
            if (!wa) return;
            window.open(`https://wa.me/${wa.replace(/\D/g, "")}`, "_blank");
          }}
        >
          WhatsApp
        </button>

        <button
          type="button"
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          onClick={() => {
            if (!phone) return;
            navigator.clipboard?.writeText(phone);
          }}
        >
          Copy phone
        </button>

        <button
          type="button"
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          onClick={() => {
            if (!email) return;
            navigator.clipboard?.writeText(email);
          }}
        >
          Copy email
        </button>
      </div>
    </div>
  );
}
