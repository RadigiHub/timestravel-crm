"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createLeadAction, listAgentsAction, type Agent, type LeadStatus } from "../actions";

type Props = {
  onCancel?: () => void;
  onCreated?: (lead: any) => void;
};

function clean(v?: string) {
  return (v ?? "").trim();
}

function toNumber(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function AddLeadForm({ onCancel, onCreated }: Props) {
  const [pending, startTransition] = useTransition();
  const [agents, setAgents] = useState<Agent[]>([]);

  const statuses: LeadStatus[] = useMemo(() => ["New", "Contacted", "Follow-Up", "Booked", "Lost"], []);

  // form state
  const [full_name, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<LeadStatus>("New");
  const [assigned_to, setAssignedTo] = useState<string>(""); // "" = unassigned
  const [follow_up_at, setFollowUpAt] = useState<string>("");

  // travel fields
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [travel_date, setTravelDate] = useState("");
  const [return_date, setReturnDate] = useState("");

  const [pax_adults, setAdults] = useState("1");
  const [pax_children, setChildren] = useState("0");
  const [pax_infants, setInfants] = useState("0");

  const [budget, setBudget] = useState("");
  const [airline, setAirline] = useState("");
  const [cabin, setCabin] = useState("");

  useEffect(() => {
    let mounted = true;
    startTransition(async () => {
      const res = await listAgentsAction();
      if (!mounted) return;
      if (res.ok) setAgents(res.data ?? []);
      else setAgents([]);
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const payload: any = {
        full_name: clean(full_name) || null,
        phone: clean(phone) || null,
        email: clean(email) || null,
        source: clean(source) || null,
        notes: clean(notes) || null,

        status,
        assigned_to: assigned_to ? assigned_to : null,
        follow_up_at: follow_up_at ? new Date(follow_up_at).toISOString() : null,

        departure: clean(departure) || null,
        destination: clean(destination) || null,
        travel_date: travel_date ? new Date(travel_date).toISOString() : null,
        return_date: return_date ? new Date(return_date).toISOString() : null,

        pax_adults: toNumber(pax_adults),
        pax_children: toNumber(pax_children),
        pax_infants: toNumber(pax_infants),

        budget: budget ? toNumber(budget) : null,
        airline: clean(airline) || null,
        cabin: clean(cabin) || null,
      };

      const res = await createLeadAction(payload);
      if (res.ok) onCreated?.(res.data);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-sm text-zinc-700">Full Name</label>
          <input className="mt-1 w-full rounded-lg border px-3 py-2" value={full_name} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-zinc-700">Phone</label>
          <input className="mt-1 w-full rounded-lg border px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-zinc-700">Email</label>
          <input className="mt-1 w-full rounded-lg border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-zinc-700">Source</label>
          <input className="mt-1 w-full rounded-lg border px-3 py-2" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Meta, WhatsApp, Website, Referral..." />
        </div>

        <div>
          <label className="text-sm text-zinc-700">Status</label>
          <select className="mt-1 w-full rounded-lg border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-700">Assign to Agent</label>
          <select className="mt-1 w-full rounded-lg border px-3 py-2" value={assigned_to} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name ?? "Unnamed"} {a.email ? `(${a.email})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-700">Follow-up (optional)</label>
          <input className="mt-1 w-full rounded-lg border px-3 py-2" type="datetime-local" value={follow_up_at} onChange={(e) => setFollowUpAt(e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl border p-3">
        <div className="mb-2 text-sm font-semibold text-zinc-800">Flight Details (Detailed Lead Form)</div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm text-zinc-700">Departure</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={departure} onChange={(e) => setDeparture(e.target.value)} placeholder="London" />
          </div>
          <div>
            <label className="text-sm text-zinc-700">Destination</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Lagos" />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Travel Date</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" type="date" value={travel_date} onChange={(e) => setTravelDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-zinc-700">Return Date</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" type="date" value={return_date} onChange={(e) => setReturnDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Adults</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={pax_adults} onChange={(e) => setAdults(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-zinc-700">Children</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={pax_children} onChange={(e) => setChildren(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Infants</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={pax_infants} onChange={(e) => setInfants(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-zinc-700">Budget</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 900" />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Preferred Airline</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Qatar, Emirates..." />
          </div>
          <div>
            <label className="text-sm text-zinc-700">Cabin</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={cabin} onChange={(e) => setCabin(e.target.value)} placeholder="Economy / Business" />
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm text-zinc-700">Notes</label>
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" className="rounded-lg border px-4 py-2" onClick={onCancel} disabled={pending}>
          Cancel
        </button>
        <button type="submit" className="rounded-lg bg-black px-4 py-2 text-white" disabled={pending}>
          {pending ? "Saving..." : "Create Lead"}
        </button>
      </div>
    </form>
  );
}
