"use client";

import * as React from "react";
import { createLeadAction, listAgentsAction } from "../actions";
import type { Agent, LeadStatus } from "../actions";

type Props = {
  onCreated?: () => void;
  onClose?: () => void;
};

const STATUSES: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

function clean(v: string) {
  const t = (v ?? "").trim();
  return t.length ? t : undefined;
}

function buildNotes(source?: string, notes?: string) {
  const s = clean(source);
  const n = clean(notes);
  if (!s && !n) return undefined;
  if (s && n) return `Source: ${s}\n\n${n}`;
  if (s) return `Source: ${s}`;
  return n;
}

export default function AddLeadForm({ onCreated, onClose }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [agentsLoading, setAgentsLoading] = React.useState(true);
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Detailed fields
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [source, setSource] = React.useState(""); // stored in notes as "Source: ..."
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] = React.useState<LeadStatus>("New");
  const [assignedTo, setAssignedTo] = React.useState<string>(""); // agent id

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setAgentsLoading(true);

        // ✅ listAgentsAction returns Agent[] (NOT { ok, data })
        const res = await listAgentsAction();

        if (!mounted) return;

        // res might be Agent[] or something else — keep it safe
        if (Array.isArray(res)) setAgents(res);
        else setAgents([]);
      } catch {
        if (mounted) setAgents([]);
      } finally {
        if (mounted) setAgentsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const name = fullName.trim();
    if (!name) {
      setError("Full Name required hai.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        // ✅ actions.ts input type uses "name" (not full_name)
        name,
        phone: clean(phone),
        email: clean(email),
        status,
        assigned_to: assignedTo ? assignedTo : null,
        // ✅ keep detail: source + notes in notes field
        notes: buildNotes(source, notes),
      };

      const res: any = await createLeadAction(payload);

      // Support both styles:
      // 1) { ok: true } / { ok:false, error:"..." }
      // 2) throws on error
      if (res && typeof res === "object" && "ok" in res) {
        if (!res.ok) {
          setError(res.error || "Lead create failed.");
          return;
        }
      }

      setSuccess("Lead created ✅");

      // reset form (keep status optional)
      setFullName("");
      setPhone("");
      setEmail("");
      setSource("");
      setNotes("");
      setStatus("New");
      setAssignedTo("");

      onCreated?.();
    } catch (err: any) {
      setError(err?.message || "Lead create failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Alerts */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {/* Row 1: Full name */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600">Full Name *</label>
        <input
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Ali Raza"
        />
      </div>

      {/* Row 2: Phone + Email */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Phone</label>
          <input
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+44 ..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Email</label>
          <input
            type="email"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
          />
        </div>
      </div>

      {/* Row 3: Source */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600">Source</label>
        <input
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Meta Ads / WhatsApp / Website / Referral..."
        />
      </div>

      {/* Row 4: Notes */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600">Notes</label>
        <textarea
          className="min-h-[96px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Extra details: travel dates, budget, destination, etc."
        />
      </div>

      {/* Row 5: Status + Assign */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Status</label>
          <select
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">Assign Agent</label>
          <select
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            disabled={agentsLoading}
          >
            <option value="">
              {agentsLoading ? "Loading agents..." : "Unassigned"}
            </option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label ?? a.name ?? a.id}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-zinc-500">
            Agent optional hai — form still works without assigning.
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            disabled={loading}
          >
            Cancel
          </button>
        ) : null}

        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Lead"}
        </button>
      </div>
    </form>
  );
}
