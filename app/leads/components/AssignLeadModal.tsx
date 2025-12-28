"use client";

import * as React from "react";
import { assignLeadAction, listAgentsAction } from "../actions";
import type { Agent, Lead } from "../actions";

type AgentLite = { id: string; full_name: string; role: string };

export default function AssignLeadModal({
  open,
  lead,
  onClose,
  onAssigned,
}: {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
  onAssigned: (updatedLead: Lead) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [agents, setAgents] = React.useState<AgentLite[]>([]);
  const [selected, setSelected] = React.useState<string>(""); // "" => unassigned
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError(null);
    setLoading(true);

    (async () => {
      try {
        const res = await listAgentsAction();
        if (cancelled) return;

        if (!res.ok) {
          setAgents([]);
          setError(res.error || "Failed to load agents");
          setLoading(false);
          return;
        }

        const rows = (res.agents ?? []) as Agent[];
        const cleaned: AgentLite[] = rows.map((a) => ({
          id: a.id,
          full_name: a.full_name ?? "Unnamed",
          role: a.role ?? "agent",
        }));

        setAgents(cleaned);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setAgents([]);
        setError(e?.message ?? "Failed to load agents");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  React.useEffect(() => {
    // when lead changes, set current assigned value
    if (!open) return;
    const current = lead?.assigned_to ?? "";
    setSelected(current);
  }, [open, lead?.id]);

  async function save() {
    if (!lead) return;

    setError(null);
    setLoading(true);

    try {
      const res = await assignLeadAction({
        lead_id: lead.id,
        assigned_to: selected ? selected : null,
      });

      if (!res.ok) {
        setError(res.error || "Failed to assign");
        setLoading(false);
        return;
      }

      onAssigned(res.lead);
      setLoading(false);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to assign");
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="text-base font-semibold text-zinc-900">Assign Lead</div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="text-sm text-zinc-700">
            <span className="font-semibold">Lead:</span> {lead?.full_name ?? "—"}
          </div>

          <div>
            <div className="text-xs text-zinc-500 mb-1">Assign to</div>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              disabled={loading}
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name} ({a.role})
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="button"
              className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              onClick={save}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Assignment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
