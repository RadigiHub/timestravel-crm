"use client";

import { useEffect, useState, useTransition } from "react";
import { listAgentsAction, type Agent } from "../actions";

type AgentLite = {
  id: string;
  full_name: string;
};

export default function AssignLeadModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (agentId: string | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [agents, setAgents] = useState<AgentLite[]>([]);

  useEffect(() => {
    if (!open) return;

    startTransition(async () => {
      const res = await listAgentsAction();

      if (res && "ok" in res && res.ok) {
        const rows = (res.data ?? []) as Agent[];
        const cleaned: AgentLite[] = rows.map((a) => ({
          id: a.id,
          full_name: (a.name ?? "Unnamed") as string,
        }));
        setAgents(cleaned);
      } else {
        setAgents([]);
      }
    });
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Assign Lead</h3>
          <button onClick={onClose} className="text-sm underline">
            Close
          </button>
        </div>

        <div className="space-y-2 max-h-[55vh] overflow-auto border rounded-md p-2">
          <button
            onClick={() => {
              onPick(null);
              onClose();
            }}
            className="w-full text-left rounded-md border px-3 py-2"
            disabled={isPending}
          >
            Unassigned
          </button>

          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                onPick(a.id);
                onClose();
              }}
              className="w-full text-left rounded-md border px-3 py-2"
              disabled={isPending}
            >
              {a.full_name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
