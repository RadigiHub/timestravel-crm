"use client";

import * as React from "react";
import { createLeadAction, listAgentsAction } from "../actions";
import type { LeadStatus, Agent, CreateLeadInput } from "../actions";

export default function AddLeadForm({
  statuses,
  defaultStatusId,
  onCreated,
  onCancel,
}: {
  statuses?: LeadStatus[];
  defaultStatusId: string;
  onCreated: (lead: any) => void;
  onCancel?: () => void;
}) {
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [source, setSource] = React.useState("web");
  const [priority, setPriority] = React.useState<"hot" | "warm" | "cold">("warm");
  const [statusId, setStatusId] = React.useState(defaultStatusId);
  const [assignedTo, setAssignedTo] = React.useState<string>("");

  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingAgents(true);
        const res = await listAgentsAction();
        if (!mounted) return;

        if (res && (res as any).ok === true) {
          setAgents((res as { ok: true; agents: Agent[] }).agents ?? []);
        } else {
          setAgents([]);
        }
      } catch {
        setAgents([]);
      } finally {
        if (mounted) setLoadingAgents(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = fullName.trim();
    if (!name) {
      setError("Full name is required.");
      return;
    }
    if (!statusId) {
      setError("Status is required.");
      return;
    }

    const phoneVal = phone.trim();
    const emailVal = email.trim();
    const sourceVal = source.trim();

    const payload: CreateLeadInput = {
      full_name: name,
      status_id: statusId,
      priority,
      source: sourceVal ? sourceVal : "web",
      phone: phoneVal ? phoneVal : null,
      email: emailVal ? emailVal : null,
      assigned_to: assignedTo ? assignedTo : null,
    };

    try {
      setSaving(true);
      const res = await createLeadAction(payload);
      if (!res || (res as any).ok !== true) {
        setError((res as any)?.error ?? "Failed to create lead.");
        return;
      }

      onCreated((res as any).lead);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create lead.");
    } finally {
      setSaving(false);
    }
  }

  const hasStatuses = (statuses ?? []).length > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">Full Name *</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          placeholder="e.g., Ali Khan"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="e.g., +44..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="e.g., name@email.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Source</label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="web / meta / whatsapp..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Assign To</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            <option value="">Unassigned</option>
            {loadingAgents ? <option>Loading…</option> : null}
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasStatuses ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Status</label>
          <select
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            {(statuses ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => onCancel?.()}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          Cancel
        </button>

        <button
          disabled={saving}
          type="submit"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Create Lead"}
        </button>
      </div>
    </form>
  );
}
