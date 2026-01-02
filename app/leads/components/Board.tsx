"use client";

import { useEffect, useMemo, useState, useTransition, useRef } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import Column from "./Column";
import AddLeadModal from "./AddLeadModal";
import AssignLeadModal from "./AssignLeadModal";
import type { Lead, LeadStatus, Agent } from "../actions";
import { listAgentsAction, moveLeadAction } from "../actions";

type Props = {
  statuses: LeadStatus[];
  initialLeads: any[];
};

function pickStatusId(lead: any, fallbackStatusId: string) {
  return (
    lead?.status_id ??
    lead?.lead_status_id ??
    lead?.status?.id ??
    fallbackStatusId
  );
}

export default function Board({ statuses, initialLeads }: Props) {
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const orderedStatuses = useMemo(() => {
    const arr = [...(statuses ?? [])];
    arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return arr;
  }, [statuses]);

  const fallbackStatusId = orderedStatuses?.[0]?.id ?? "unknown";

  const [leadsById, setLeadsById] = useState<Record<string, Lead>>(() => {
    const map: Record<string, Lead> = {};
    for (const raw of initialLeads ?? []) {
      const status_id = pickStatusId(raw, fallbackStatusId);

      map[String(raw.id)] = {
        ...(raw as any),
        id: String(raw.id),
        status_id,
      } as Lead;
    }
    return map;
  });

  const [leadIdsByStatus, setLeadIdsByStatus] = useState<Record<string, string[]>>(() => {
    const buckets: Record<string, string[]> = {};
    for (const s of orderedStatuses) buckets[s.id] = [];

    for (const raw of initialLeads ?? []) {
      const id = String(raw.id);
      const sid = pickStatusId(raw, fallbackStatusId);
      if (!buckets[sid]) buckets[sid] = [];
      buckets[sid].push(id);
    }

    return buckets;
  });

  const [agents, setAgents] = useState<Agent[]>([]);

  // Assign modal state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await listAgentsAction();
      if (res.ok) setAgents(res.data ?? []);
    })();
  }, []);

  function onView(_lead: Lead) {
    // abhi simple — later details drawer/modal add kar lena
  }

  function onAction(lead: Lead, _anchor: HTMLButtonElement) {
    setAssignLeadId(String(lead.id));
    setAssignOpen(true);
  }

  async function persistMove(leadId: string, toStatusId: string, toIndex: number) {
    startTransition(async () => {
      const res = await moveLeadAction({ id: leadId, status_id: toStatusId, position: toIndex });
      if (!res.ok) {
        // agar chaho to rollback/refresh logic yahan add kar sakte ho
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const overId = String(over.id);

    // overId ya to column status.id hoga (droppable) ya kisi lead ka id
    const allStatusIds = new Set(orderedStatuses.map((s) => String(s.id)));

    // Find current status of dragged lead
    const currentLead = leadsById[leadId] as any;
    const fromStatusId = String(currentLead?.status_id ?? fallbackStatusId);

    // Determine target status
    let toStatusId = fromStatusId;

    if (allStatusIds.has(overId)) {
      toStatusId = overId;
    } else {
      // over another lead => find its status bucket
      for (const [sid, ids] of Object.entries(leadIdsByStatus)) {
        if (ids.includes(overId)) {
          toStatusId = sid;
          break;
        }
      }
    }

    // If nothing changed, return
    if (!toStatusId) return;

    // optimistic move
    setLeadIdsByStatus((prev) => {
      const next = { ...prev };

      // remove from old bucket
      next[fromStatusId] = (next[fromStatusId] ?? []).filter((x) => x !== leadId);

      // insert into new bucket
      const target = [...(next[toStatusId] ?? [])];

      let insertIndex = target.length;
      if (!allStatusIds.has(overId)) {
        const idx = target.indexOf(overId);
        if (idx >= 0) insertIndex = idx;
      }

      target.splice(insertIndex, 0, leadId);
      next[toStatusId] = target;

      // update lead status_id too
      setLeadsById((m) => ({
        ...m,
        [leadId]: { ...(m[leadId] as any), status_id: toStatusId } as Lead,
      }));

      // persist
      persistMove(leadId, toStatusId, insertIndex);

      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-zinc-900">Leads Board</div>
          <div className="text-sm text-zinc-600">Drag & drop to move leads across stages.</div>
        </div>
        <AddLeadModal />
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {orderedStatuses.map((st) => (
            <Column
              key={st.id}
              status={st}
              leadIds={leadIdsByStatus[st.id] ?? []}
              leadsById={leadsById}
              onView={onView}
              onAction={onAction}
            />
          ))}
        </div>
      </DndContext>

      {/* Assign Lead Modal */}
      <AssignLeadModal
        open={assignOpen}
        onOpenChange={setAssignOpen}
        agents={agents}
        leadId={assignLeadId}
        onDone={() => {
          setAssignOpen(false);
          setAssignLeadId(null);
        }}
      />
    </div>
  );
}
