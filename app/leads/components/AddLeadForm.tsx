"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createLeadAction,
  getAgentsAction,
  type Agent,
  type LeadStatus,
} from "../actions";

function clean(v?: string) {
  return (v ?? "").trim();
}

type Props = {
  statuses?: LeadStatus[];
  defaultStatusId?: string;
  onCancel?: () => void;
  onCreated?: (lead: any) => void;

  // backwards compatibility (agar kisi jagah old prop use ho)
  onDone?: () => void;
};

const DEFAULT_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Follow-Up",
  "Booked",
  "Lost",
];

export default function AddLeadForm({
  statuses,
  defaultStatusId,
  onCancel,
  onCreated,
  onDone,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const statusList = useMemo(
    () => (statuses && statuses.length ? statuses : DEFAULT_STATUSES),
    [statuses]
  );

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("web");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<LeadStatus>(
    (defaultStatusId as LeadStatus) || "New"
  );

  const [agents, setAgents] = useState<Agent[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>("");

  const [err, setErr] = useState<string>("");
  const [okMsg, setOkMsg] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    startTransition(async () => {
      const res = await getAgentsAction();
      if (!mounted) return;

      if (res && "ok" in res && res.ok) {
        setAgents(res.data ?? []);
      } else {
        setAgents([]);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOkMsg("");

    const name = clean(fullName);
    if (!name) {
      setErr("Full name is required.");
      return;
    }

    startTransition(async () => {
      const res = await createLeadAction({
        name,
        phone: clean(phone),
        email: clean(email),
        source: clean(source) || "web",
        notes: clean(notes),
        status,
        assigned_to: assignedTo ? assignedTo : null,
      });

      if (!res.ok) {
        setErr(res.error);
        return;
      }

      setOkMsg("Lead added ✅");
      setFullName("");
      setPhone("");
      setEmail("");
      setSource("web");
      setNotes("");
      setStatus((defaultStatusId as LeadStatus) || "New");
      setAssignedTo("");

      onCreated?.(res.data);
      onDone?.();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {okMsg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {okMsg}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-zinc-600">Full Name *</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="e.g. Ali Khan"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="+92 3xx xxxxxxx"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="name@email.com"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600">Source</label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="web / whatsapp / meta / referral..."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            {statusList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600">Assign Agent</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name || a.email || a.id}
              </option>
            ))}
          </select>
          <div className="mt-1 text-[11px] text-zinc-500">
            Agents list empty ho to bhi form work karega.
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-600">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          rows={4}
          placeholder="Customer request, route, dates, budget, etc..."
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => (onCancel ? onCancel() : onDone?.())}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          disabled={isPending}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Add Lead"}
        </button>
      </div>
    </form>
  );
}
