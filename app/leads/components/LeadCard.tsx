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

  trip_type?: string | null;
  from_city?: string | null;
  to_city?: string | null;
  depart_date?: string | null;
  return_date?: string | null;
  cabin?: string | null;
  budget?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  whatsapp?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
};

type Props = {
  lead: Lead;
  isOverlay?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
};

function priorityLabel(p: Lead["priority"]) {
  if (p === "hot") return "HOT";
  if (p === "warm") return "WARM";
  return "COLD";
}

function priorityClasses(p: Lead["priority"]) {
  if (p === "hot") return "bg-red-100 text-red-700 border-red-200";
  if (p === "warm") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-sky-100 text-sky-700 border-sky-200";
}

export default function LeadCard({ lead, isOverlay, dragHandleProps }: Props) {
  return (
    <div
      className={[
        "rounded-2xl border border-zinc-200 bg-white shadow-sm",
        isOverlay ? "shadow-lg" : "",
      ].join(" ")}
    >
      {/* DRAG HANDLE (ONLY THIS AREA DRAGS) */}
      <div
        {...dragHandleProps}
        className="flex cursor-grab items-center justify-between rounded-t-2xl border-b border-zinc-100 bg-zinc-50 px-3 py-2 active:cursor-grabbing"
        style={{ touchAction: "none" }} // VERY IMPORTANT
      >
        <div className="text-xs font-semibold text-zinc-700">Drag</div>
        <div className="flex items-center gap-2">
          <span
            className={[
              "rounded-full border px-2 py-0.5 text-[10px] font-bold",
              priorityClasses(lead.priority),
            ].join(" ")}
          >
            {priorityLabel(lead.priority)}
          </span>
          <span className="text-[10px] text-zinc-400">ID: {lead.id.slice(0, 5)}</span>
        </div>
      </div>

      {/* BODY */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-zinc-900">{lead.full_name}</div>

            {lead.phone ? (
              <div className="mt-1 text-xs text-zinc-600">📞 {lead.phone}</div>
            ) : null}

            {lead.email ? (
              <div className="mt-1 text-xs text-zinc-600">✉️ {lead.email}</div>
            ) : null}
          </div>
        </div>

        {/* Trip mini info (optional) */}
        {(lead.from_city || lead.to_city) && (
          <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 p-2">
            <div className="text-xs font-semibold text-zinc-800">
              {lead.from_city ?? "—"} → {lead.to_city ?? "—"}
              {lead.trip_type ? (
                <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[10px] text-zinc-600 border border-zinc-200">
                  {lead.trip_type}
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-700">
              {lead.depart_date ? (
                <span className="rounded-full border border-zinc-200 bg-white px-2 py-1">
                  🗓 {lead.depart_date}
                </span>
              ) : null}
              {lead.return_date ? (
                <span className="rounded-full border border-zinc-200 bg-white px-2 py-1">
                  ↩ {lead.return_date}
                </span>
              ) : null}
              {lead.cabin ? (
                <span className="rounded-full border border-zinc-200 bg-white px-2 py-1">
                  ✈ {lead.cabin}
                </span>
              ) : null}
              {lead.budget ? (
                <span className="rounded-full border border-zinc-200 bg-white px-2 py-1">
                  💷 {lead.budget}
                </span>
              ) : null}
            </div>
          </div>
        )}

        {/* Follow up */}
        {lead.follow_up_date ? (
          <div className="mt-3 text-xs text-zinc-700">
            <span className="font-semibold">Follow-up:</span> {lead.follow_up_date}
          </div>
        ) : null}

        {/* Notes */}
        {lead.notes ? (
          <div className="mt-2 text-xs text-zinc-600">
            <span className="font-semibold text-zinc-700">Notes:</span> {lead.notes}
          </div>
        ) : null}

        {/* ACTIONS (safe from drag because drag handle is separate) */}
        <div className="mt-3 flex flex-wrap gap-2">
          {lead.phone ? (
            <a
              href={`tel:${lead.phone}`}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              📞 Call
            </a>
          ) : null}

          {lead.whatsapp || lead.phone ? (
            <a
              href={
                lead.whatsapp
                  ? `https://wa.me/${lead.whatsapp.replace(/\+/g, "").replace(/\s/g, "")}`
                  : `https://wa.me/${(lead.phone ?? "").replace(/\+/g, "").replace(/\s/g, "")}`
              }
              target="_blank"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
              rel="noreferrer"
            >
              💬 WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
