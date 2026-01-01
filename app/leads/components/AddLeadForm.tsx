"use client";

import * as React from "react";
import { createLeadAction, listAgentsAction } from "../actions";
import type { Agent, LeadStatus } from "../actions";

type Props = {
  onCreated?: () => void;
  defaultStatus?: LeadStatus;
  defaultAssignedTo?: string | null;
};

const STATUSES: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

function clean(v: string) {
  const t = (v ?? "").trim();
  return t.length ? t : undefined;
}

export default function AddLeadForm({ onCreated, defaultStatus = "New", defaultAssignedTo = null }: Props) {
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [source, setSource] = React.useState("web");
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] = React.useState<LeadStatus>(defaultStatus);
  const [assignedTo, setAssignedTo] = React.useState<string | null>(defaultAssignedTo);

  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = React.useState(true);

  const [err, setErr] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingAgents(true);
        const res = await listAgentsAction();
        if (!alive) return;

        if (res && "ok" in res && res.ok) {
          setAgents(res.data ?? []);
        } else {
          // silently fail (form still works without agents)
          setAgents([]);
        }
      } catch {
        if (!alive) return;
        setAgents([]);
      } finally {
        if (!alive) return;
        setLoadingAgents(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const canSubmit = React.useMemo(() => {
    return fullName.trim().length >= 2 && !isPending;
  }, [fullName, isPending]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkMsg(null);

    const name = fullName.trim();
    if (name.length < 2) {
      setErr("Full name required (min 2 characters).");
      return;
    }

    // Keep form detailed, but action expects: name/phone/email/notes/status/assigned_to
    const sourceTag = clean(source) ? `[Source: ${source.trim()}]` : undefined;
    const userNotes = clean(notes);

    const mergedNotes =
      sourceTag && userNotes
        ? `${sourceTag}\n${userNotes}`
        : sourceTag
          ? `${sourceTag}`
          : userNotes
            ? `${userNotes}`
            : undefined;

    startTransition(async () => {
      try {
        const res = await createLeadAction({
          name,
          phone: clean(phone),
          email: clean(email),
          notes: mergedNotes,
          status,
          assigned_to: assignedTo ?? null,
        });

        if (!res?.ok) {
          setErr(res?.error ?? "Failed to create lead.");
          return;
        }

        setOkMsg("Lead created ✅");
        // reset (keep status + assigned if you want; I’m resetting status to New)
        setFullName("");
        setPhone("");
        setEmail("");
        setSource("web");
        setNotes("");
        setStatus(defaultStatus);
        setAssignedTo(defaultAssignedTo);

        onCreated?.();
      } catch (e: any) {
        setErr(e?.message ?? "Failed to create lead.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Title */}
      <div className="space-y-1">
        <div className="text-base font-semibold text-zinc-900">Add Lead</div>
        <div className="text-sm text-zinc-600">
          Full details add karo — phir board me status move/assign kar sakte ho.
        </div>
      </div>

      {/* Alerts */}
      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}
      {okMsg ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {okMsg}
        </div>
      ) : null}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Full Name *</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Ali Khan"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
          <div className="text-[11px] text-zinc-500">Required</div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +44 7xxxx"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. customer@email.com"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            <option value="web">Web</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="google">Google</option>
            <option value="referral">Referral</option>
            <option value="call">Call</option>
            <option value="walk-in">Walk-in</option>
            <option value="other">Other</option>
          </select>
          <div className="text-[11px] text-zinc-500">
            Note: Source automatically Notes me save ho jayega.
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700">Assign to Agent</label>
          <select
            value={assignedTo ?? ""}
            onChange={(e) => setAssignedTo(e.target.value ? e.target.value : null)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            disabled={loadingAgents}
          >
            <option value="">{loadingAgents ? "Loading agents..." : "Unassigned"}</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.email ?? a.id}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-zinc-500">Optional</div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-700">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Trip details, dates, budget, route, etc..."
          className="min-h-[110px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Create Lead"}
        </button>
      </div>
    </form>
  );
}
