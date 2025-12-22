"use client";

import React from "react";
import type { Lead } from "./Board";

type DragHandleProps = {
  attributes: Record<string, any>;
  listeners: Record<string, any>;
  setActivatorNodeRef: (el: HTMLElement | null) => void;
};

export default function LeadCard({
  lead,
  isOverlay,
  dragHandleProps,
}: {
  lead: Lead;
  isOverlay?: boolean;
  dragHandleProps?: DragHandleProps;
}) {
  const priorityLabel =
    lead.priority === "hot" ? "HOT" : lead.priority === "warm" ? "WARM" : "COLD";

  const priorityClass =
    lead.priority === "hot"
      ? "bg-red-50 text-red-700 border-red-200"
      : lead.priority === "warm"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div
      className={[
        "rounded-2xl border border-zinc-200 bg-white shadow-sm",
        isOverlay ? "shadow-lg" : "",
      ].join(" ")}
    >
      {/* ✅ DRAG HANDLE (only here drag start hoga) */}
      <div
        ref={dragHandleProps?.setActivatorNodeRef}
        {...(dragHandleProps?.attributes ?? {})}
        {...(dragHandleProps?.listeners ?? {})}
        className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: "none" }}
        title="Drag"
      >
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-10 rounded-full bg-zinc-200" />
          <span className="text-[11px] text-zinc-500">Drag</span>
        </div>

        <div className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityClass}`}>
          {priorityLabel}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="font-semibold text-zinc-900">{lead.full_name}</div>

        <div className="mt-2 space-y-1 text-sm text-zinc-600">
          {lead.phone ? (
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">📞</span>
              <span>{lead.phone}</span>
            </div>
          ) : null}
          {lead.email ? (
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">✉️</span>
              <span className="truncate">{lead.email}</span>
            </div>
          ) : null}
        </div>

        {/* Optional Trip Block (safe if fields exist) */}
        {(lead.from_city || lead.to_city || lead.trip_type) && (
          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-700">
            <div className="font-medium">
              {(lead.from_city ?? "—")} → {(lead.to_city ?? "—")}{" "}
              {lead.trip_type ? (
                <span className="ml-2 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px]">
                  {lead.trip_type}
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-[11px] text-zinc-600">
              {lead.source ? `Source: ${lead.source}` : null}
            </div>
          </div>
        )}

        {/* Buttons (drag safe) */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-100"
            onClick={() => {
              if (!lead.phone) return;
              window.open(`tel:${lead.phone}`, "_self");
            }}
          >
            📞 Call
          </button>

          <button
            type="button"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-100"
            onClick={() => {
              const phone = lead.whatsapp || lead.phone;
              if (!phone) return;
              const msg = encodeURIComponent("Hello! We received your travel inquiry.");
              window.open(`https://wa.me/${phone.replace(/\s+/g, "")}?text=${msg}`, "_blank");
            }}
          >
            💬 WhatsApp
          </button>

          <button
            type="button"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-100"
            onClick={async () => {
              if (!lead.phone) return;
              await navigator.clipboard.writeText(lead.phone);
            }}
          >
            📋 Copy phone
          </button>

          <button
            type="button"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-100"
            onClick={async () => {
              if (!lead.email) return;
              await navigator.clipboard.writeText(lead.email);
            }}
          >
            📋 Copy email
          </button>
        </div>
      </div>
    </div>
  );
}
