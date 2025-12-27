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
import { moveLeadAction, listAgentsAction } from "../actions";
import type { Lead, LeadStatus } from "../actions";

type AgentLite = {
  id: string;
  full_name?: string | null;
  email?: string | null; // optional (agar exist ho)
};

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

function safeIncludes(hay: string | null | undefined, needle: string) {
  if (!hay) return false;
  return hay.toLowerCase().includes(needle);
}

function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
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

  // ✅ NEW: load agents (id -> name)
  const [agentsById, setAgentsById] = React.useState<Record<string, AgentLite>>({});

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = (await listAgentsAction()) as any[];
        if (cancelled) return;

        const map: Record<string, AgentLite> = {};
        for (const r of rows ?? []) {
          if (!r?.id) continue;
          map[String(r.id)] = {
            id: String(r.id),
            full_name: r.full_name ?? null,
            email: r.email ?? null,
          };
        }
        setAgentsById(map);
      } catch {
        // ignore (dropdown will fallback to UUID)
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ NEW: filters
  const [search, setSearch] = React.useState("");
  const [assignedFilter, setAssignedFilter] = React.useState<string>("all"); // all | unassigned | agentId

  const searchNeedle = search.trim().toLowerCase();

  const passesFilters = React.useCallback(
    (lead: Lead) => {
      // assigned filter
      if (assignedFilter === "unassigned") {
        if (lead.assigned_to) return false;
      } else if (assignedFilter !== "all") {
        if ((lead.assigned_to ?? "") !== assignedFilter) return false;
      }

      // search filter
      if (!searchNeedle) return true;
      return (
        safeIncludes(lead.full_name, searchNeedle) ||
        safeIncludes(lead.phone, searchNeedle) ||
        safeIncludes(lead.email, searchNeedle) ||
        safeIncludes(lead.source, searchNeedle) ||
        safeIncludes(lead.destination, searchNeedle) ||
        safeIncludes(lead.departure, searchNeedle)
      );
    },
    [assignedFilter, searchNeedle]
  );

  // Build a set of allowed lead IDs based on filters (so Column works unchanged)
  const allowedLeadIds = React.useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) {
      if (passesFilters(l)) set.add(l.id);
    }
    return set;
  }, [leads, passesFilters]);

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
      customText?.trim()
        ? customText.trim()
        : `Hi ${name ?? ""}, regarding your travel inquiry...`
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

  // ✅ dropdown options: unique assigned_to IDs, but show agent full_name
  const assignedOptions = React.useMemo(() => {
    const ids = new Set<string>();
    for (const l of leads) {
      if (l.assigned_to) ids.add(l.assigned_to);
    }
    return Array.from(ids).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const getAgentLabel = (agentId: string) => {
    const a = agentsById[agentId];
    const name = a?.full_name?.trim();
    if (name) return name;
    const email = (a as any)?.email?.trim?.();
    if (email) return email;
    return shortId(agentId);
  };

  return (
    <div className="mt-5">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
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

        {/* ✅ Filter Bar */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / phone / email / source / route..."
              className="w-full md:w-[420px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />

            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="w-full md:w-[260px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="all">All (Assigned + Unassigned)</option>
              <option value="unassigned">Unassigned Only</option>

              {assignedOptions.map((agentId) => (
                <option key={agentId} value={agentId}>
                  Assigned: {getAgentLabel(agentId)}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-zinc-500">
            Showing{" "}
            <span className="font-semibold text-zinc-700">{allowedLeadIds.size}</span>{" "}
            lead(s)
          </div>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statuses.map((s) => {
            const rawIds = orderByStatus[s.id] ?? [];
            const filteredIds = rawIds.filter((id) => allowedLeadIds.has(id));

            return (
              <Column
                key={s.id}
                status={s as any}
                leadIds={filteredIds}
                leadsById={leadsById as any}
                onView={(lead: Lead) => setViewLead(lead)}
                onAction={(lead: Lead, anchor: HTMLButtonElement) => openActions(lead, anchor)}
              />
            );
          })}
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
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
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

            <div className="p-5 space-y-4">
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
                  <div className="text-xs text-zinc-500">Trip Type</div>
                  <div className="text-sm text-zinc-800">{viewLead.trip_type ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Cabin</div>
                  <div className="text-sm text-zinc-800">{viewLead.cabin_class ?? "—"}</div>
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
                  onClick={() =>
                    openWhatsApp(viewLead.whatsapp ?? viewLead.phone, viewLead.full_name, viewLead.whatsapp_text)
                  }
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
          <div style={menuStyle} className="z-[60] w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
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
