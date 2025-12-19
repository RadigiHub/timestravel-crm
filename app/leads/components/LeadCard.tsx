"use client";

import { useMemo, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source?: string | null;

  // board fields
  status_id: string;
  position: number;
  priority: "hot" | "warm" | "cold";

  // travel fields (optional, depending on your DB)
  trip_type?: "oneway" | "return" | "multicity" | null;
  departure?: string | null;
  destination?: string | null;
  depart_date?: string | null;   // ISO date
  return_date?: string | null;   // ISO date
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  cabin_class?: string | null;
  preferred_airline?: string | null;
  budget?: string | null;
  whatsapp?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;

  created_at?: string | null;
};

function clsx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function formatDate(d?: string | null) {
  if (!d) return "";
  // handles "YYYY-MM-DD" safely
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

function cleanPhone(p?: string | null) {
  if (!p) return "";
  return p.replace(/\s+/g, "").replace(/[()\-]/g, "");
}

function badge(priority: Lead["priority"]) {
  if (priority === "hot") return "bg-red-50 text-red-700 border-red-200";
  if (priority === "cold") return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-amber-50 text-amber-800 border-amber-200"; // warm default
}

export default function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [copied, setCopied] = useState<"" | "phone" | "email">("");

  const route = useMemo(() => {
    const from = (lead.departure || "").trim();
    const to = (lead.destination || "").trim();
    if (!from && !to) return "";
    if (from && to) return `${from} → ${to}`;
    return from || to;
  }, [lead.departure, lead.destination]);

  const dates = useMemo(() => {
    const d1 = formatDate(lead.depart_date);
    const d2 = formatDate(lead.return_date);
    if (!d1 && !d2) return "";
    if (d1 && d2) return `${d1} - ${d2}`;
    return d1 || d2;
  }, [lead.depart_date, lead.return_date]);

  const pax = useMemo(() => {
    const a = lead.adults ?? null;
    const c = lead.children ?? null;
    const i = lead.infants ?? null;
    const bits: string[] = [];
    if (typeof a === "number") bits.push(`A:${a}`);
    if (typeof c === "number") bits.push(`C:${c}`);
    if (typeof i === "number") bits.push(`I:${i}`);
    return bits.length ? bits.join("  ") : "";
  }, [lead.adults, lead.children, lead.infants]);

  const phoneClean = cleanPhone(lead.phone);
  const whatsappClean = cleanPhone(lead.whatsapp || lead.phone);

  const waLink = useMemo(() => {
    if (!whatsappClean) return "";
    const msg = encodeURIComponent(
      `Hi ${lead.full_name || ""}! Thanks for contacting Times Travel. Please confirm your travel details: ${route || ""} ${dates || ""}`.trim()
    );
    // if starts with +, remove it for wa.me
    const num = whatsappClean.startsWith("+") ? whatsappClean.slice(1) : whatsappClean;
    return `https://wa.me/${num}?text=${msg}`;
  }, [whatsappClean, lead.full_name, route, dates]);

  async function copyText(type: "phone" | "email") {
    const text = type === "phone" ? (lead.phone || "") : (lead.email || "");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(""), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm",
        "hover:border-zinc-300 hover:shadow-md",
        isDragging && "opacity-70 rotate-[0.3deg]"
      )}
      {...attributes}
      {...listeners}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-900">
            {lead.full_name || "Unnamed Lead"}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            {lead.phone ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-zinc-400">📞</span> {lead.phone}
              </span>
            ) : null}

            {lead.email ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-zinc-400">✉️</span>
                <span className="truncate">{lead.email}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={clsx(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              badge(lead.priority)
            )}
            title="Priority"
          >
            {lead.priority.toUpperCase()}
          </span>

          <div className="text-[10px] text-zinc-400">ID: {lead.id.slice(0, 6)}</div>
        </div>
      </div>

      {/* Route + dates */}
      {(route || dates) ? (
        <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
          {route ? (
            <div className="text-xs font-semibold text-zinc-800">
              {route}
              {lead.trip_type ? (
                <span className="ml-2 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                  {lead.trip_type}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            {dates ? (
              <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-700">
                🗓 {dates}
              </span>
            ) : null}

            {pax ? (
              <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-700">
                👥 {pax}
              </span>
            ) : null}

            {lead.cabin_class ? (
              <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-700">
                💺 {lead.cabin_class}
              </span>
            ) : null}
          </div>

          {(lead.preferred_airline || lead.budget) ? (
            <div className="mt-2 text-[11px] text-zinc-600">
              {lead.preferred_airline ? (
                <span className="mr-3">
                  Airline: <span className="font-semibold">{lead.preferred_airline}</span>
                </span>
              ) : null}
              {lead.budget ? (
                <span>
                  Budget: <span className="font-semibold">{lead.budget}</span>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Follow-up */}
      {lead.follow_up_date ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-3">
          <div className="text-xs text-zinc-700">
            <span className="font-semibold">Follow-up:</span>{" "}
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px]">
              {formatDate(lead.follow_up_date)}
            </span>
          </div>
          <div className="text-[11px] text-zinc-500">⏰ Reminder set</div>
        </div>
      ) : null}

      {/* Notes */}
      {lead.notes ? (
        <div className="mt-3 line-clamp-3 text-xs text-zinc-600">
          <span className="font-semibold text-zinc-700">Notes:</span> {lead.notes}
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => (phoneClean ? window.open(`tel:${phoneClean}`) : null)}
          disabled={!phoneClean}
          className={clsx(
            "h-9 rounded-xl border px-3 text-xs font-semibold",
            phoneClean
              ? "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
              : "cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-400"
          )}
          title="Call"
        >
          📞 Call
        </button>

        <button
          type="button"
          onClick={() => (waLink ? window.open(waLink, "_blank") : null)}
          disabled={!waLink}
          className={clsx(
            "h-9 rounded-xl border px-3 text-xs font-semibold",
            waLink
              ? "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
              : "cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-400"
          )}
          title="WhatsApp"
        >
          💬 WhatsApp
        </button>

        <button
          type="button"
          onClick={() => copyText("phone")}
          disabled={!lead.phone}
          className={clsx(
            "h-9 rounded-xl border px-3 text-xs font-semibold",
            lead.phone
              ? "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
              : "cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-400"
          )}
          title="Copy phone"
        >
          {copied === "phone" ? "✅ Copied" : "📋 Copy phone"}
        </button>

        <button
          type="button"
          onClick={() => copyText("email")}
          disabled={!lead.email}
          className={clsx(
            "h-9 rounded-xl border px-3 text-xs font-semibold",
            lead.email
              ? "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
              : "cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-400"
          )}
          title="Copy email"
        >
          {copied === "email" ? "✅ Copied" : "📋 Copy email"}
        </button>

        {/* subtle hint for drag */}
        <div className="ml-auto hidden text-[11px] text-zinc-400 group-hover:block">
          Drag to move →
        </div>
      </div>
    </div>
  );
}
