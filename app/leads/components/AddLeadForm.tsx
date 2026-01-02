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
  statuses?: LeadStatus[];
  defaultStatusId?: string; // we will map this into status if provided
  onCancel?: () => void;
  onCreated?: (lead: any) => void;
  onDone?: () => void; // optional simple callback
};

export default function AddLeadForm({
  statuses,
  defaultStatusId,
  onCancel,
  onCreated,
  onDone,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("web");
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");

  const statusOptions = useMemo<LeadStatus[]>(
    () => statuses ?? ["New", "Contacted", "Follow-Up", "Booked", "Lost"],
    [statuses]
  );

  // defaultStatusId may come from older code; treat it as LeadStatus when possible
  const initialStatus =
    (defaultStatusId as LeadStatus | undefined) ?? statusOptions[0];

  const [status, setStatus] = useState<LeadStatus>(initialStatus);

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

  function submit() {
    startTransition(async () => {
      const res = await createLeadAction({
        full_name: clean(fullName),
        phone: clean(phone),
        email: clean(email),
        source: clean(source) || "web",
        notes: clean(notes) || undefined,
        status,
        assigned_to: assignedTo ? assignedTo : null,
      });

      if (res.ok) {
        onCreated?.(res.data);
        onDone?.();
      } else {
        alert(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-sm font-medium">Full Name</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Ahmed Khan"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Source</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="web / whatsapp / meta / call"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Assign To (optional)</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {(a.full_name ?? "Unnamed") + (a.email ? ` (${a.email})` : "")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any details..."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          className="rounded-md border px-4 py-2"
          onClick={() => onCancel?.()}
          disabled={isPending}
          type="button"
        >
          Cancel
        </button>

        <button
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
          onClick={submit}
          disabled={isPending}
          type="button"
        >
          {isPending ? "Saving..." : "Create Lead"}
        </button>
      </div>
    </div>
  );
}
