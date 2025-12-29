"use client";

import * as React from "react";
import { createLeadAction, listAgentsAction } from "../actions";
import type { LeadStatus, Agent, CreateLeadInput } from "../actions";

export default function AddLeadForm({
  statuses,
  defaultStatusId,
  onCreated,
}: {
  statuses: LeadStatus[];
  defaultStatusId: string;
  onCreated: (lead: any) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [source, setSource] = React.useState("web");
  const [statusId, setStatusId] = React.useState(defaultStatusId);

  const [assignedTo, setAssignedTo] = React.useState<string>(""); // "" means unassigned in UI
  const [agents, setAgents] = React.useState<Agent[]>([]);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await listAgentsAction();
        if (!mounted) return;
        if (res && res.ok) setAgents(res.agents ?? []);
      } catch {
        // ignore (agents optional)
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: CreateLeadInput = {
        full_name: fullName.trim(),
        phone: phone.trim() ? phone.trim() : null,
        email: email.trim() ? email.trim() : null,
        source: source.trim() ? source.trim() : "web",
        status_id: statusId,
        assigned_to: assignedTo ? assignedTo : null,
      };

      const res = await createLeadAction(payload);

      if (!res.ok) {
        setError(res.error || "Failed to create lead.");
        setLoading(false);
        return;
      }

      onCreated(res.lead);

      // reset form
      setFullName("");
      setPhone("");
      setEmail("");
      setSource("web");
      setStatusId(defaultStatusId);
      setAssignedTo("");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-xs text-zinc-600">Full Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          placeholder="e.g. Ahmed Khan"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-600">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="e.g. +92..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-600">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="e.g. name@email.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-600">Source</label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="web / whatsapp / call..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-600">Status</label>
          <select
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-600">Assign To (optional)</label>
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        >
          <option value="">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name} ({a.role})
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create Lead"}
      </button>
    </form>
  );
}
