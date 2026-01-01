"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createLeadAction, getAgentsAction, type Agent, type LeadStatus } from "../actions";

function clean(v?: string) {
  return (v ?? "").trim();
}

function buildNotes(source?: string, notes?: string) {
  const s = clean(source);
  const n = clean(notes);

  if (!s && !n) return undefined;
  if (s && n) return `Source: ${s}\n\n${n}`;
  if (s) return `Source: ${s}`;
  return n;
}

const STATUSES: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

export default function AddLeadForm({ onDone }: { onDone?: () => void }) {
  const [isPending, startTransition] = useTransition();

  // detailed fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("web");
  const [status, setStatus] = useState<LeadStatus>("New");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const agentOptions = useMemo(() => {
    return (agents ?? []).map((a) => ({
      id: a.id,
      label: (a.full_name || a.name || a.email || "Agent").toString(),
    }));
  }, [agents]);

  useEffect(() => {
    let mounted = true;

    startTransition(async () => {
      const res = await getAgentsAction();
      if (!mounted) return;

      if (res.ok) setAgents(res.data ?? []);
      else setAgents([]); // form still works without agents
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const n = clean(fullName);
    if (!n) {
      setError("Full name required.");
      return;
    }

    const finalNotes = buildNotes(source, notes);

    startTransition(async () => {
      const res = await createLeadAction({
        // IMPORTANT: DB expects "name" (NOT full_name)
        name: n,
        phone: clean(phone) || undefined,
        email: clean(email) || undefined,
        status,
        assigned_to: clean(assignedTo) ? clean(assignedTo) : null,
        notes: finalNotes,
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      setSuccess("Lead added successfully ✅");

      // reset (keep source default)
      setFullName("");
      setPhone("");
      setEmail("");
      setStatus("New");
      setAssignedTo("");
      setNotes("");

      onDone?.();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Top row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-zinc-700">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="e.g. Ahmed Khan"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="+44 / 03xx..."
          />
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-zinc-700">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="name@email.com"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700">Source</label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="web / whatsapp / facebook / call"
          />
          <div className="mt-1 text-[11px] text-zinc-500">
            Source DB me alag column nahi hai to notes me save ho jayega.
          </div>
        </div>
      </div>

      {/* Third row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-zinc-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700">Assign to Agent</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            <option value="">Unassigned</option>
            {agentOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          {!agents.length ? (
            <div className="mt-1 text-[11px] text-zinc-500">
              Agents load nahi hue — form phir bhi kaam karega.
            </div>
          ) : null}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-medium text-zinc-700">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 min-h-[110px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          placeholder="Extra details, budget, dates, route, etc..."
        />
      </div>

      {/* Alerts */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Add Lead"}
      </button>
    </form>
  );
}
