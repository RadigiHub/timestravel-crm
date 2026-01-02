"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createLeadAction,
  listAgentsAction,
  type Agent,
  type LeadStatus,
} from "../actions";

function clean(v?: string) {
  return (v ?? "").trim();
}

type Props = {
  /** optional statuses coming from parent */
  statuses?: LeadStatus[];
  /** optional default status */
  defaultStatusId?: LeadStatus | string;
  onCancel?: () => void;
  onCreated?: (lead: any) => void;
  /** compatibility */
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

  // form fields (DETAIL form)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("web");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<LeadStatus>("New");
  const [assignedTo, setAssignedTo] = useState<string>("");

  // agents
  const [agents, setAgents] = useState<Agent[]>([]);

  const statusList = useMemo(() => {
    return (statuses && statuses.length ? statuses : DEFAULT_STATUSES) as LeadStatus[];
  }, [statuses]);

  // init default status
  useEffect(() => {
    const ds = (defaultStatusId as LeadStatus | undefined) ?? "New";
    if (statusList.includes(ds)) setStatus(ds);
  }, [defaultStatusId, statusList]);

  // load agents
  useEffect(() => {
    let mounted = true;

    startTransition(async () => {
      const res = await listAgentsAction();
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const res = await createLeadAction({
        name: clean(fullName), // map full_name -> name (DB)
        phone: clean(phone),
        email: clean(email),
        source: clean(source) || "web",
        notes: clean(notes),
        status,
        assigned_to: assignedTo ? assignedTo : null,
      });

      if (res && "ok" in res && res.ok) {
        onCreated?.(res.data);
        onDone?.();
      } else {
        alert((res as any)?.error ?? "Failed to create lead");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          placeholder="e.g. Ahmed Khan"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="+44..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="name@email.com"
            type="email"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Source</label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="web / whatsapp / facebook..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            className="w-full rounded-md border px-3 py-2"
          >
            {statusList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Assign To</label>
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {(a.name ?? "Unnamed") + (a.email ? ` (${a.email})` : "")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border px-3 py-2 min-h-[110px]"
          placeholder="Any details…"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => onCancel?.()}
          className="rounded-md border px-4 py-2"
          disabled={isPending}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="rounded-md bg-black text-white px-4 py-2"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Create Lead"}
        </button>
      </div>
    </form>
  );
}
