"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createLeadAction, listAgentsAction, type Agent, type LeadStatus } from "../actions";

type Props = {
  onDone?: () => void;
};

const STATUSES: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function AddLeadForm({ onDone }: Props) {
  const [pending, startTransition] = useTransition();
  const [agents, setAgents] = useState<Agent[]>([]);

  // basic
  const [full_name, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<LeadStatus>("New");
  const [assigned_to, setAssignedTo] = useState<string>(""); // "" means null

  const [follow_up_at, setFollowUpAt] = useState(""); // datetime-local

  // flight details (detail wala form)
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [travel_date, setTravelDate] = useState("");
  const [return_date, setReturnDate] = useState("");

  const [pax_adults, setPaxAdults] = useState("1");
  const [pax_children, setPaxChildren] = useState("0");
  const [pax_infants, setPaxInfants] = useState("0");

  const [budget, setBudget] = useState("");
  const [airline, setAirline] = useState("");
  const [cabin, setCabin] = useState("");

  const canSubmit = useMemo(() => {
    // minimum: phone ya name
    return full_name.trim().length > 0 || phone.trim().length > 0;
  }, [full_name, phone]);

  useEffect(() => {
    (async () => {
      const res = await listAgentsAction();
      if (res.ok) setAgents(res.data ?? []);
      else setAgents([]);
    })();
  }, []);

  function reset() {
    setFullName("");
    setPhone("");
    setEmail("");
    setSource("");
    setNotes("");
    setStatus("New");
    setAssignedTo("");
    setFollowUpAt("");

    setDeparture("");
    setDestination("");
    setTravelDate("");
    setReturnDate("");
    setPaxAdults("1");
    setPaxChildren("0");
    setPaxInfants("0");
    setBudget("");
    setAirline("");
    setCabin("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || pending) return;

    startTransition(async () => {
      const res = await createLeadAction({
        full_name: full_name.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        source: source.trim() || null,
        notes: notes.trim() || null,

        status,
        assigned_to: assigned_to || null,
        follow_up_at: follow_up_at ? new Date(follow_up_at).toISOString() : null,

        departure: departure.trim() || null,
        destination: destination.trim() || null,
        travel_date: travel_date ? new Date(travel_date).toISOString() : null,
        return_date: return_date ? new Date(return_date).toISOString() : null,

        pax_adults: toNum(pax_adults),
        pax_children: toNum(pax_children),
        pax_infants: toNum(pax_infants),

        budget: budget ? toNum(budget) : null,
        airline: airline.trim() || null,
        cabin: cabin.trim() || null,
      });

      if (res.ok) {
        reset();
        onDone?.();
      } else {
        alert(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-sm text-zinc-700">Full Name</label>
          <input className="mt-1 w-full rounded-xl border px-3 py-2" value={full_name} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-zinc-700">Phone</label>
          <input className="mt-1 w-full rounded-xl border px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-zinc-700">Email</label>
          <input className="mt-1 w-full rounded-xl border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-zinc-700">Source</label>
          <input className="mt-1 w-full rounded-xl border px-3 py-2" value={source} onChange={(e) => setSource(e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-zinc-700">Status</label>
          <select className="mt-1 w-full rounded-xl border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-700">Assign Agent</label>
          <select className="mt-1 w-full rounded-xl border px-3 py-2" value={assigned_to} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {(a.full_name ?? "Unnamed") + (a.email ? ` — ${a.email}` : "")}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-zinc-700">Follow Up (optional)</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={follow_up_at}
            onChange={(e) => setFollowUpAt(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-zinc-700">Notes</label>
          <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <div className="mb-3 text-sm font-semibold text-zinc-900">Flight Details</div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm text-zinc-700">Departure</label>
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={departure} onChange={(e) => setDeparture(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Destination</label>
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Travel Date</label>
            <input type="date" className="mt-1 w-full rounded-xl border px-3 py-2" value={travel_date} onChange={(e) => setTravelDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Return Date</label>
            <input type="date" className="mt-1 w-full rounded-xl border px-3 py-2" value={return_date} onChange={(e) => setReturnDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Adults</label>
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={pax_adults} onChange={(e) => setPaxAdults(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Children</label>
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={pax_children} onChange={(e) => setPaxChildren(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Infants</label>
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={pax_infants} onChange={(e) => setPaxInfants(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Budget</label>
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Preferred Airline</label>
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={airline} onChange={(e) => setAirline(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Cabin</label>
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={cabin} onChange={(e) => setCabin(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={!canSubmit || pending}
          className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Saving..." : "Create Lead"}
        </button>
      </div>
    </form>
  );
}
