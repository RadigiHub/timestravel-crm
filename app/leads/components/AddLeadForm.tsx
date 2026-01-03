"use client";

import { useMemo, useState, useTransition } from "react";
import { createLeadAction, type Lead, type LeadStatus } from "../actions";

const STATUSES: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clean(v?: string) {
  return (v ?? "").trim();
}

export default function AddLeadForm({ onDone }: { onDone?: () => void }) {
  const [pending, startTransition] = useTransition();

  const [full_name, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<LeadStatus>("New");

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

  const canSubmit = useMemo(() => {
    return clean(phone).length > 0 || clean(full_name).length > 0 || clean(email).length > 0;
  }, [phone, full_name, email]);

  function submit() {
    if (!canSubmit || pending) return;

    const payload: Partial<Lead> = {
      full_name: clean(full_name) || null,
      phone: clean(phone) || null,
      email: clean(email) || null,
      source: clean(source) || null,
      notes: clean(notes) || null,

      status,

      departure: clean(departure) || null,
      destination: clean(destination) || null,
      travel_date: clean(travel_date) || null,
      return_date: clean(return_date) || null,

      pax_adults: toNum(pax_adults),
      pax_children: toNum(pax_children),
      pax_infants: toNum(pax_infants),

      budget: toNum(budget),
      airline: clean(airline) || null,
      cabin: clean(cabin) || null,
    };

    startTransition(async () => {
      const res = await createLeadAction(payload);
      if (res.ok) onDone?.();
      else alert(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Full name" value={full_name} onChange={(e) => setFullName(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <input className="w-full rounded-xl border px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Source (FB, WA, Call...)" value={source} onChange={(e) => setSource(e.target.value)} />

        <select
          className="w-full rounded-xl border px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as LeadStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input className="w-full rounded-xl border px-3 py-2" placeholder="Cabin (Economy/Business)" value={cabin} onChange={(e) => setCabin(e.target.value)} />
      </div>

      <textarea className="w-full rounded-xl border px-3 py-2" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Departure" value={departure} onChange={(e) => setDeparture(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} />

        <input className="w-full rounded-xl border px-3 py-2" placeholder="Travel date (YYYY-MM-DD)" value={travel_date} onChange={(e) => setTravelDate(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Return date (YYYY-MM-DD)" value={return_date} onChange={(e) => setReturnDate(e.target.value)} />

        <input className="w-full rounded-xl border px-3 py-2" placeholder="Adults" value={pax_adults} onChange={(e) => setAdults(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Children" value={pax_children} onChange={(e) => setChildren(e.target.value)} />

        <input className="w-full rounded-xl border px-3 py-2" placeholder="Infants" value={pax_infants} onChange={(e) => setInfants(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Budget" value={budget} onChange={(e) => setBudget(e.target.value)} />

        <input className="w-full rounded-xl border px-3 py-2" placeholder="Preferred airline" value={airline} onChange={(e) => setAirline(e.target.value)} />
      </div>

      <button
        onClick={submit}
        disabled={!canSubmit || pending}
        className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Create Lead"}
      </button>
    </div>
  );
}
