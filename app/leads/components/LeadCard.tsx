"use client";

import { useMemo, useRef } from "react";
import type { Agent, Lead, LeadStatus } from "../actions";

type Props = {
  lead: Lead;

  // New flow (Column.tsx) props
  agents?: Agent[];
  disabled?: boolean;
  onMove?: (id: string, status: LeadStatus) => void | Promise<void>;
  onAssign?: (id: string, agent_id: string | null) => void | Promise<void>;

  // Old flow (SortableLeadCard.tsx) props (optional)
  onView?: (lead: Lead) => void;
  onAction?: (lead: Lead, anchor: HTMLButtonElement) => void;
  dragHandleProps?: any;
};

const STATUSES: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

export default function LeadCard({
  lead,
  agents = [],
  disabled = false,
  onMove,
  onAssign,
  onView,
  onAction,
  dragHandleProps,
}: Props) {
  const actionBtnRef = useRef<HTMLButtonElement | null>(null);

  const title = useMemo(() => {
    const n = (lead.full_name ?? "").trim();
    const p = (lead.phone ?? "").trim();
    const e = (lead.email ?? "").trim();
    return n || p || e || "Unnamed lead";
  }, [lead.full_name, lead.phone, lead.email]);

  const sub = useMemo(() => {
    const parts = [lead.phone, lead.email, lead.source].filter(Boolean);
    return parts.join(" • ");
  }, [lead.phone, lead.email, lead.source]);

  return (
    <div
      className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
      onClick={() => onView?.(lead)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-900">{title}</div>
          {sub ? <div className="mt-0.5 truncate text-xs text-zinc-600">{sub}</div> : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Drag handle (optional) */}
          <span
            {...(dragHandleProps ?? {})}
            className="cursor-grab select-none rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600 active:cursor-grabbing"
            title="Drag"
            onClick={(e) => e.stopPropagation()}
          >
            ⋮⋮
          </span>

          {/* Actions menu button (optional) */}
          <button
            ref={actionBtnRef}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
            onClick={(e) => {
              e.stopPropagation();
              if (onAction && actionBtnRef.current) onAction(lead, actionBtnRef.current);
            }}
            type="button"
            title="Actions"
          >
            •••
          </button>
        </div>
      </div>

      {/* ✅ Controls */}
      {(onMove || onAssign) && (
        <div className="mt-3 grid grid-cols-1 gap-2">
          {onMove && (
            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={(lead.status ?? "New") as LeadStatus}
              onChange={(e) => onMove(lead.id, e.target.value as LeadStatus)}
              disabled={disabled}
              onClick={(e) => e.stopPropagation()}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* ✅ IMPORTANT: DB field is agent_id */}
          {onAssign && (
            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={lead.agent_id ?? ""}
              onChange={(e) => onAssign(lead.id, e.target.value || null)}
              disabled={disabled}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name ?? a.email ?? a.id}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {lead.notes ? (
        <div className="mt-2 line-clamp-2 text-xs text-zinc-600">{lead.notes}</div>
      ) : null}
    </div>
  );
}
