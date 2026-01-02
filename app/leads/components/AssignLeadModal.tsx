"use client";

import { useEffect, useState, useTransition } from "react";
import { listAgentsAction, assignLeadAction, type Agent } from "../actions";

export default function AssignLeadModal({
  leadId,
  currentAgentId,
  onClose,
}: {
  leadId: string;
  currentAgentId: string | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<string>(currentAgentId ?? "");

  useEffect(() => {
    (async () => {
      const res = await listAgentsAction();
      if (res.ok) setAgents(res.data ?? []);
      else setAgents([]);
    })();
  }, []);

  function save() {
    startTransition(async () => {
      const res = await assignLeadAction({ id: leadId, assigned_to: selected || null });
      if (!res.ok) {
        alert(res.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">Assign Agent</div>
          <button onClick={onClose} className="rounded-lg px-3 py-1 hover:bg-zinc-100">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <select className="w-full rounded-xl border px-3 py-2" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {(a.full_name ?? "Unnamed") + (a.email ? ` — ${a.email}` : "")}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-xl border px-4 py-2">
              Cancel
            </button>
            <button onClick={save} disabled={pending} className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50">
              {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
