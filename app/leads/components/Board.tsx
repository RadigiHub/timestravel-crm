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
import {
  moveLeadAction,
  listAgentsAction,
} from "../actions";
import type { Lead, LeadStatus } from "../actions";

/* ================================
   Types
================================ */
type Agent = {
  id: string;
  full_name: string | null;
};

/* ================================
   Normalize Lead
================================ */
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

    trip_type: l.trip_type ?? null,
    departure: l.departure ?? null,
    destination: l.destination ?? null,
    depart_date: l.depart_date ?? null,
    return_date: l.return_date ?? null,
    adults: l.adults ?? null,
    children: l.children ?? null,
    infants: l.infants ?? null,
    cabin_class: l.cabin_class ?? null,
    budget: l.budget ?? null,
    preferred_airline: l.preferred_airline ?? null,
    whatsapp: l.whatsapp ?? null,
    notes: l.notes ?? null,
    follow_up_date: l.follow_up_date ?? null,
    whatsapp_text: l.whatsapp_text ?? null,
  };
}

/* ================================
   Board Component
================================ */
export default function Board({
  statuses,
  initialLeads,
}: {
  statuses: LeadStatus[];
  initialLeads: Lead[];
}) {
  /* ---------- Drag ---------- */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  /* ---------- State ---------- */
  const [leads, setLeads] = React.useState<Lead[]>(
    (initialLeads ?? []).map(normalizeLead)
  );

  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [assignFilter, setAssignFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  const [orderByStatus, setOrderByStatus] =
    React.useState<Record<string, string[]>>({});

  const [viewLead, setViewLead] = React.useState<Lead | null>(null);
  const [actionLead, setActionLead] = React.useState<Lead | null>(null);
  const [actionAnchor, setActionAnchor] =
    React.useState<HTMLButtonElement | null>(null);

  /* ---------- Load Agents ---------- */
  React.useEffect(() => {
    listAgentsAction().then((res) => {
      if (Array.isArray(res)) setAgents(res);
    });
  }, []);

  const agentsById = React.useMemo(() => {
    const map: Record<string, Agent> = {};
    agents.forEach((a) => (map[a.id] = a));
    return map;
  }, [agents]);

  const agentLabel = (agentId: string | null) => {
    if (!agentId) return "Unassigned";
    const a = agentsById[agentId];
    return a?.full_name?.trim() || agentId;
  };

  /* ---------- Leads Map ---------- */
  const leadsById = React.useMemo(() => {
    const map: Record<string, Lead> = {};
    leads.forEach((l) => (map[l.id] = l));
    return map;
  }, [leads]);

  /* ---------- Order ---------- */
  React.useEffect(() => {
    const next: Record<string, string[]> = {};
    statuses.forEach((s) => (next[s.id] = []));

    const sorted = [...leads].sort((a, b) => {
      if (a.status_id === b.status_id)
        return (a.position ?? 0) - (b.position ?? 0);
      return a.status_id.localeCompare(b.status_id);
    });

    sorted.forEach((l) => {
      if (next[l.status_id]) next[l.status_id].push(l.id);
    });

    setOrderByStatus(next);
  }, [statuses, leads]);

  /* ---------- Drag End ---------- */
  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    let fromStatusId: string | null = null;
    let toStatusId: string | null = null;

    statuses.forEach((s) => {
      if (orderByStatus[s.id]?.includes(activeId)) fromStatusId = s.id;
      if (orderByStatus[s.id]?.includes(overId)) toStatusId = s.id;
    });

    if (!fromStatusId || !toStatusId) return;

    const fromIds = [...orderByStatus[fromStatusId]];
    const toIds =
      fromStatusId === toStatusId
        ? fromIds
        : [...orderByStatus[toStatusId]];

    const oldIndex = fromIds.indexOf(activeId);
    const newIndex = toIds.indexOf(overId);

    if (fromStatusId === toStatusId) {
      const reordered = arrayMove(fromIds, oldIndex, newIndex);
      setOrderByStatus({ ...orderByStatus, [fromStatusId]: reordered });
      await moveLeadAction({
        fromStatusId,
        toStatusId,
        fromOrderIds: reordered,
        toOrderIds: reordered,
      });
      return;
    }

    fromIds.splice(oldIndex, 1);
    toIds.splice(newIndex < 0 ? toIds.length : newIndex, 0, activeId);

    setOrderByStatus({
      ...orderByStatus,
      [fromStatusId]: fromIds,
      [toStatusId]: toIds,
    });

    await moveLeadAction({
      fromStatusId,
      toStatusId,
      fromOrderIds: fromIds,
      toOrderIds: toIds,
    });
  }

  /* ---------- Filtered Leads ---------- */
  const filteredLeads = leads.filter((l) => {
    if (assignFilter === "unassigned" && l.assigned_to) return false;
    if (assignFilter !== "all" && assignFilter !== "unassigned") {
      if (l.assigned_to !== assignFilter) return false;
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      const text = [
        l.full_name,
        l.phone,
        l.email,
        l.source,
        l.departure,
        l.destination,
      ]
        .join(" ")
        .toLowerCase();
      if (!text.includes(s)) return false;
    }

    return true;
  });

  /* ================================
     Render
================================ */
  return (
    <div className="mt-5">
      {/* Top Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name / phone / email / source / route..."
          className="h-9 w-64 rounded-md border px-3 text-sm"
        />

        <select
          value={assignFilter}
          onChange={(e) => setAssignFilter(e.target.value)}
          className="h-9 rounded-md border px-3 text-sm"
        >
          <option value="all">All (Assigned + Unassigned)</option>
          <option value="unassigned">Unassigned Only</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              Assigned: {a.full_name}
            </option>
          ))}
        </select>

        <div className="ml-auto text-sm text-zinc-500">
          Showing {filteredLeads.length} lead(s)
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statuses.map((s) => (
            <Column
              key={s.id}
              status={s}
              leadIds={orderByStatus[s.id] ?? []}
              leadsById={leadsById}
              filterFn={(id) =>
                filteredLeads.some((l) => l.id === id)
              }
              onView={setViewLead}
              onAction={(lead, btn) => {
                setActionLead(lead);
                setActionAnchor(btn);
              }}
            />
          ))}
        </div>
      </DndContext>

      {/* Add Lead */}
      <AddLeadModal
        defaultStatusId={statuses[0]?.id}
        onCreated={(l) => setLeads((p) => [normalizeLead(l), ...p])}
      />
    </div>
  );
}
