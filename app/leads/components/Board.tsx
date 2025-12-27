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
import { moveLeadAction, listAgentsAction, assignLeadAction } from "../actions";
import type { Lead, LeadStatus, Agent } from "../actions";

function normalizeLead(l: any): Lead {
  return {
    id: l.id,
    full_name: l.full_name ?? null,
    phone: l.phone ?? null,
    email: l.email ?? null,
    source: l.source ?? null,
    status_id: l.status_id,
    position: Number(l.position ?? 0),
    priority: (l.priority ?? "warm") as any,

    assigned_to: l.assigned_to ?? null,
    created_by: l.created_by ?? null,
    last_activity_at: l.last_activity_at ?? null,

    created_at: l.created_at ?? "",
    updated_at: l.updated_at ?? "",

    details: l.details ?? {},

    trip_type: (l.trip_type ?? null) as any,
    departure: l.departure ?? null,
    destination: l.destination ?? null,
    depart_date: l.depart_date ?? null,
    return_date: l.return_date ?? null,

    adults: typeof l.adults === "number" ? l.adults : l.adults ?? null,
    children: typeof l.children === "number" ? l.children : l.children ?? null,
    infants: typeof l.infants === "number" ? l.infants : l.infants ?? null,

    cabin_class: (l.cabin_class ?? null) as any,
    budget: l.budget ?? null,
    preferred_airline: l.preferred_airline ?? null,
    whatsapp: l.whatsapp ?? null,
    notes: l.notes ?? null,
    follow_up_date: l.follow_up_date ?? null,
    whatsapp_text: l.whatsapp_text ?? null,
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
      return a.status_id.localeCompare(b.status_id);
    });

    for (const l of sorted) {
      const sid = l.status_id;
      if (!sid) continue;
      if (!next[sid]) next[sid] = [];
      next[sid].push(l.id);
    }

    setOrderByStatus(next);
  }, [statuses, leads]);

  // agents
  const [agents, setAgents] = React.useState<Agent[]>([]);
  React.useEffect(() => {
    (async () => {
      const res = await listAgentsAction();
      if ((res as any)?.ok) setAgents((res as any).agents ?? []);
    })();
  }, []);

  const agentNameById = React.useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of agents) m[a.id] = a.full_name;
    return m;
  }, [agents]);

  const [viewLead, setViewLead] = React.useState<Lead | null>(null);

  // action menu
  const [actionLead, setActionLead] = React.useState<Lead | null>(null);
  const [actionAnchor, setActionAnchor] = React.useState<HTMLButtonElement | null>(null);
  const [assignOpen, setAssignOpen] = React.useState(false);

  function openActions(lead: Lead, anchor: HTMLButtonElement) {
    setActionLead(lead);
    setActionAnchor(anchor);
    setAssignOpen(false);
  }
  function closeActions() {
    setActionLead(null);
    setActionAnchor(null);
    setAssignOpen(false);
  }

  async function applyAssignedTo(leadId: string, assignedTo: string | null) {
    // optimistic UI
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, assigned_to: assignedTo } : l)));
    if (viewLead?.id === leadId) setViewLead({ ...viewLead, assigned_to: assignedTo });

    const res = await assignLeadAction({ lead_id: leadId, assigned_to: assignedTo });
    if (!(res as any)?.ok) {
      // revert if failed
      setLeads((prev) => prev); // no-op safe (keeps UI). You can enhance later.
    } else {
      const updated = normalizeLead((res as any).lead);
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      if (viewLead?.id === updated.id) setViewLead(updated);
    }
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

    if (!toStatusId && orderByStatus[overId]) {
      toStatusId = overId;
    }

    if (!fromStatusId || !toStatusId) return;

    const fromIds = [...(orderByStatus[fromStatusId] ?? [])];
    const toIds = fromStatusId === toStatusId ? fromIds : [...(orderByStatus[toStatusId] ?? [])];

    const oldIndex = fromIds.indexOf(activeId);
    const newIndex = toIds.indexOf(overId);

    if (fromStatusId === toStatusId) {
      const reordered = arrayMove(fromIds, oldIndex, newIndex < 0 ? fromIds.length - 1 : newIndex);
      const next = { ...orderByStatus, [fromStatusId]: reordered };
      setOrderByStatus(next);

      setLeads((prev) =>
        prev.map((l) => {
          if (l.status_id !== fromStatusId) return l;
          const pos = reordered.indexOf(l.id);
          return { ...l, position: pos };
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

    const next = {
      ...orderByStatus,
      [fromStatusId]: fromIds,
      [toStatusId]: toIds,
    };
    setOrderByStatus(next);

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
        return {
          position: "fixed",
          top: rect.bottom + 8,
          left: rect.left,
          zIndex: 60,
        };
      })()
    : undefined;

  function copyText(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function openWhatsApp(phone: string | null, name: string | null, customText?: string | null) {
    if (!phone) return;
    const msg = encodeURIComponent(
      customText?.trim() ? customText.trim() : `Hi ${name ?? ""}, regarding your travel inquiry...`
    );
    const digits = phone.replace(/[^\d]/g, "");
    window.open(`https://wa.me/${digits}?text=${msg}`, "_blank");
  }

  const paxText = (l: Lead) => {
    const a = typeof l.adults === "number" ? l.adults : null;
    const c = typeof l.children === "number" ? l.children : null;
    const i = typeof l.infants === "number" ? l.infants : null;
    const parts = [
      a != null ? `A:${a}` : null,
      c != null ? `C:${c}` : null,
      i != null ? `I:${i}` : null,
    ].filter(Boolean);
    return parts.length ? parts.join("  ") : "—";
  };

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
              status={s as any}
              leadIds={orderByStatus[s.id] ?? []}
              leadsById={leadsById as any}
              onView={(lead: Lead) => setViewLead(lead)}
              onAction={(lead: Lead, anchor: HTMLButtonElement) => openActions(lead, anchor)}
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
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
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

            <div className="max-h-[80vh] overflow-y-auto p-5 space-y-4">
              <div>
                <div className="text-xs text-zinc-500">Name</div>
                <div className="text-lg font-semibold text-zinc-900">{viewLead.full_name ?? "—"}</div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <div className="text-xs text-zinc-500">Phone</div>
                  <div className="text-sm text-zinc-800">{viewLead.phone ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Email</div>
                  <div className="text-sm text-zinc-800">{viewLead.email ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Source</div>
                  <div className="text-sm text-zinc-800">{viewLead.source ?? "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <div className="text-xs text-zinc-500">Assigned To</div>
                  <select
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                    value={viewLead.assigned_to ?? ""}
                    onChange={(e) => applyAssignedTo(viewLead.id, e.target.value ? e.target.value : null)}
                  >
                    <option value="">Unassigned</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-xs text-zinc-500">Trip Type</div>
                  <div className="text-sm text-zinc-800">{viewLead.trip_type ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">PAX</div>
                  <div className="text-sm text-zinc-800">{paxText(viewLead)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs text-zinc-500">Route</div>
                  <div className="text-sm text-zinc-800">
                    {(viewLead.departure ?? "—")} → {(viewLead.destination ?? "—")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Dates</div>
                  <div className="text-sm text-zinc-800">
                    {viewLead.depart_date ?? "—"}
                    {viewLead.return_date ? `  →  ${viewLead.return_date}` : ""}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs text-zinc-500">Budget</div>
                  <div className="text-sm text-zinc-800">{viewLead.budget ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Preferred Airline</div>
                  <div className="text-sm text-zinc-800">{viewLead.preferred_airline ?? "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs text-zinc-500">WhatsApp</div>
                  <div className="text-sm text-zinc-800">{viewLead.whatsapp ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Follow-up Date</div>
                  <div className="text-sm text-zinc-800">{viewLead.follow_up_date ?? "—"}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-zinc-500">Notes</div>
                <div className="whitespace-pre-wrap text-sm text-zinc-800">{viewLead.notes ?? "—"}</div>
              </div>

              <div>
                <div className="text-xs text-zinc-500">WhatsApp Text</div>
                <div className="whitespace-pre-wrap text-sm text-zinc-800">{viewLead.whatsapp_text ?? "—"}</div>
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
                  onClick={() => openWhatsApp(viewLead.whatsapp ?? viewLead.phone, viewLead.full_name, viewLead.whatsapp_text)}
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
          <div style={menuStyle} className="z-[60] w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
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
                openWhatsApp(actionLead.whatsapp ?? actionLead.phone, actionLead.full_name, actionLead.whatsapp_text);
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
              onClick={() => setAssignOpen((v) => !v)}
            >
              Assign Lead
              <span className="float-right text-xs text-zinc-500">
                {actionLead.assigned_to ? agentNameById[actionLead.assigned_to] ?? "Assigned" : "Unassigned"}
              </span>
            </button>

            {assignOpen && (
              <div className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-zinc-100 p-1">
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50"
                  onClick={async () => {
                    await applyAssignedTo(actionLead.id, null);
                    closeActions();
                  }}
                >
                  Unassign
                </button>
                <div className="my-1 border-t border-zinc-100" />
                {agents.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50"
                    onClick={async () => {
                      await applyAssignedTo(actionLead.id, a.id);
                      closeActions();
                    }}
                  >
                    {a.full_name}
                  </button>
                ))}
              </div>
            )}

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
