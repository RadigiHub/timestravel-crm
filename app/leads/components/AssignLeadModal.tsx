"use client";

import { useEffect, useState, useTransition } from "react";
import { assignLeadAction, listAgentsAction, type Agent } from "../actions";

type Props = {
  leadId: string;
  currentAgentId?: string | null;
  onDone?: () => void;
};

export default function AssignLeadModal({ leadId, currentAgentId, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<string>(currentAgentId ?? "");

  useEffect(() => {
    let mounted = true;

    startTransition(async () => {
      const res = await listAgentsAction();
      if (!mounted) return;

      if (res.ok) setAgents(res.data ?? []);
      else setAgents([]);
    });

    return () => {
      mounted = false;
    };
  }, []);

  function save() {
    startTransition(async () => {
      const res = await assignLeadAction({
        leadId,
        agentId: selected ? selected : null,
      });

      if (res.ok) {
        setOpen(false);
        onDone?.();
      } else {
        alert(res.error);
      }
    });
  }

  return (
    <>
      <button className="rounded-md border px-3 py-1" onClick={() => setOpen(true)}>
        Assign
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div className="font-semibold">Assign Lead</div>
              <button className="rounded-md border px-3 py-1" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="text-sm font-medium">Agent</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {(a.full_name ?? "Unnamed") + (a.email ? ` (${a.email})` : "")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button className="rounded-md border px-4 py-2" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancel
                </button>
                <button
                  className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
                  onClick={save}
                  disabled={isPending}
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
