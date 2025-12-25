"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import Column from "./Column";
import AddLeadModal from "./AddLeadModal";
import { moveLeadAction } from "../actions";
import type { Lead, LeadStatus } from "../actions";

function normalizeLead(l: any): Lead {
  return {
    id: l.id,
    full_name: l.full_name ?? null,
    phone: l.phone ?? null,
    email: l.email ?? null,
    source: l.source ?? null,
    status_id: l.status_id,
    position: typeof l.position === "number" ? l.position : Number(l.position ?? 0),
    priority: (l.priority ?? "warm") as any,
    assigned_to: l.assigned_to ?? null,
    created_at: l.created_at ?? null,
    updated_at: l.updated_at ?? null,
  };
}

export default function Board({
  statuses,
  initialLeads,
}: {
  statuses: LeadStatus[];
  initialLeads: Lead[];
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const [leads, setLeads] = React.useState<Lead[]>(
    (initialLeads ?? []).map(normalizeLead)
  );

  const leadsById = React.useMemo(() => {
    const map: Record<string, Lead> = {};
    for (const l of leads) map[l.id] = l;
    return map;
  }, [leads]);

  const [orderByStatus, setOrderByStatus] = React.useState<Record<string, string[]>>({});

  React.useEffect(() => {
    const next: Record<string, string[]> = {};
    for (const s of statuses) next[s.id] = [];

    const sorted = [...leads].sort((a, b) => {
      if (a.status_id === b.status_id) return (a.position ?? 0) - (b.position ?? 0);
      return String(a.status_id).localeCompare(String(b.status_id));
    });

    for (const l of sorted) {
      const sid = l.status_id;
      if (!sid) continue;
      if (!next[sid]) next[sid] = [];
      next[sid].push(l.id);
    }
    setOrderByStatus(next);
  }, [statuses, leads]);

  const [viewLead, setViewLead] = React.useState<Lead | null>(null);

  const [actionLead, setActionLead] = React.useState<Lead | null>(null);
  const [actionAnchor, setActionAnchor] = React.useState<HTMLButtonElement | null>(null);

  function openActions(lead: Lead, anchor: HTMLButtonElement) {
    setActionLead(lead);
    setActionAnchor(anchor);
  }

  function closeActions() {
    setActionLead(null);
    setActionAnchor(null);
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    let fromStatusId: string | null = null;
    let toStatusId: string | null = null;

    for (const s of statuses) {
      const ids = orderByStatus[s.id] ?? [];
      if (ids.includes(activeId)) fromStatusId = s.id;
      if (ids.includes(overId)) toStatusId = s.id;
    }

    if (!toStatusId && orderByStatus[overId]) toStatusId = overId;

    if (!fromStatusId || !toStatusId) return;

    const fromIds = [...(orderByStatus[fromStatusId] ?? [])];
    const toIds =
      fromStatusId === toStatusId ? fromIds : [...(orderByStatus[toStatusId] ?? [])];

    const oldIndex = fromIds.indexOf(activeId);
    const newIndex = toIds.indexOf(overId);

    if (fromStatusId === toStatusId) {
      const reordered = arrayMove(fromIds, oldIndex, newIndex < 0 ? fromIds.length - 1 : newIndex);

      setOrderByStatus((prev) => ({ ...prev, [fromStatusId!]: reordered }));

      setLeads((prev) =>
        prev.map((l) => {
          if (l.status_id !== fromStatusId) return l;
          return { ...l, position: reordered.indexOf(l.id) };
        })
      );

      await moveLeadAction({
        fromStatusId,
        toStatusId,
        fromOrderIds: reordered,
        toOrderIds: reordered,
      });

      return;
    }

    fromIds.splice(oldIndex, 1);
    const insertIndex = newIndex >= 0 ? newIndex : toIds.length;
    toIds.splice(insertIndex, 0, activeId);

    setOrderByStatus((prev) => ({
      ...prev,
      [fromStatusId!]: fromIds,
      [toStatusId!]: toIds,
    }));

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === activeId) return { ...l, status_id: toStatusId!, position: insertIndex };
        if (l.status_id === fromStatusId) return { ...l, position: fromIds.indexOf(l.id) };
        if (l.status_id === toStatusId) return { ...l, position: toIds.indexOf(l.id) };
        return l;
      })
    );

    await moveLeadAction({
      fromStatusId,
      toStatusId,
      fromOrderIds: fromIds,
      toOrderIds: toIds,
    });
  }

  const firstStatusId = statuses?.[0]?.id ?? "";

  const menuStyle: React.CSSProperties | undefined = actionAnchor
    ? (() => {
        const rect = actionAnchor.getBoundingClientRect();
        return { position: "fixed", top: rect.bottom + 8, left: rect.left, zIndex: 60 };
      })()
    : undefined;

  function copyText(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function openWhatsApp(phone: string | null, name: string | null) {
    if (!phone) return;
    const msg = encodeURIComponent(`Hi ${name ?? ""}, regarding your travel inquiry...`);
    const digits = phone.replace(/[^\d]/g, "");
    window.open(`https://wa.me/${digits}?text=${msg}`, "_blank");
  }

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-600">
          Tip: Drag only from the <span className="font-semibold">Drag</span> handle.
        </div>

        {firstStatusId ? (
          <AddLeadModal
            defaultStatusId={firstStatusId}
            onCreated={(newLead) => {
              const lead = normalizeLead(newLead);
              setLeads((prev) => [lead, ...prev]);
              setOrderByStatus((prev) => {
                const cur = prev[firstStatusId] ?? [];
                return { ...prev, [firstStatusId]: [lead.id, ...cur] };
              });
            }}
          />
        ) : null}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statuses.map((s) => (
            <Column
              key={s.id}
              status={s}
              leadIds={orderByStatus[s.id] ?? []}
              leadsById={leadsById}
              onView={(lead) => setViewLead(lead)}
              onAction={(lead, anchor) => openActions(lead, anchor)}
            />
          ))}
        </div>
      </DndContext>

      {/* VIEW MODAL */}
      {viewLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setViewLead(null);
          }}
        >
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div className="text-base font-semibold text-zinc-900">Lead Details</div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                onClick={() => setViewLead(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 p-5">
              <div>
                <div className="text-xs text-zinc-500">Name</div>
                <div className="font-semibold text-zinc-900">{viewLead.full_name ?? "—"}</div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs text-zinc-500">Phone</div>
                  <div className="text-sm text-zinc-800">{viewLead.phone ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Email</div>
                  <div className="text-sm text-zinc-800">{viewLead.email ?? "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs text-zinc-500">Source</div>
                  <div className="text-sm text-zinc-800">{viewLead.source ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Priority</div>
                  <div className="text-sm text-zinc-800 capitalize">{viewLead.priority ?? "warm"}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                  onClick={() => {
                    if (viewLead.phone) window.open(`tel:${viewLead.phone}`, "_self");
                  }}
                >
                  Call
                </button>

                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                  onClick={() => openWhatsApp(viewLead.phone, viewLead.full_name)}
                >
                  WhatsApp
                </button>

                <button
                  type="button"
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                  onClick={() => setViewLead(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MENU */}
      {actionLead && actionAnchor && (
        <>
          <div className="fixed inset-0 z-50" onMouseDown={closeActions} />
          <div
            style={menuStyle}
            className="z-[60] w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg"
          >
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50"
              onClick={() => {
                closeActions();
                if (actionLead.phone) window.open(`tel:${actionLead.phone}`, "_self");
              }}
            >
              Call
            </button>

            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50"
              onClick={() => {
                closeActions();
                openWhatsApp(actionLead.phone, actionLead.full_name);
              }}
            >
              WhatsApp Message
            </button>

            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50"
              onClick={() => {
                closeActions();
                if (actionLead.email) window.open(`mailto:${actionLead.email}`, "_self");
              }}
            >
              Email
            </button>

            <div className="my-1 border-t border-zinc-100" />

            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50"
              onClick={() => {
                copyText(actionLead.phone ?? "");
                closeActions();
              }}
            >
              Copy Phone
            </button>

            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50"
              onClick={() => {
                copyText(actionLead.email ?? "");
                closeActions();
              }}
            >
              Copy Email
            </button>

            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50"
              onClick={() => {
                setViewLead(actionLead);
                closeActions();
              }}
            >
              Open Details
            </button>
          </div>
        </>
      )}
    </div>
  );
}
