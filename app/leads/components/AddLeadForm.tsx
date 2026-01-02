"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createLeadAction, listAgentsAction, type Agent, type LeadStatus } from "../actions";

function clean(v?: string | null) {
  return (v ?? "").trim();
}

export default function AddLeadForm({ onDone }: { onDone?: () => void }) {
  const [pending, startTransition] = useTransition();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadAgents, setLoadAgents] = useState(false);

  // BASIC
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // DETAIL
  const [source, setSource] = useState("web");
  const [notes, setNotes] = useState("");

  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [paxAdults, setPaxAdults] = useState<number>(1);
  const [paxChildren, setPaxChildren] = useState<number>(0);
  const [paxInfants, setPaxInfants] = useState<number>(0);

  const [budget, setBudget] = useState("");
  const [airline, setAirline] = useState("");
  const [cabin, setCabin] = useState("");

  const [status, setStatus] = useState<LeadStatus>("New");
  const [assignedTo, setAssignedTo] = useState<string>("");

  const [followUpAt, setFollowUpAt] = useState(""); // datetime-local
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => clean(fullName).length > 0, [fullName]);

  // ✅ load agents safely
  useEffect(() => {
    let alive = true;
    setLoadAgents(true);

    (async () => {
      const res = await listAgentsAction();
      if (!alive) return;

      if (res.ok) setAgents(res.data ?? []);
      else setAgents([]);

      setLoadAgents(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  function resetForm() {
    setFullName("");
    setPhone("");
    setEmail("");
    setSource("web");
    setNotes("");
    setDeparture("");
    setDestination("");
    setTravelDate("");
    setReturnDate("");
    setPaxAdults(1);
    setPaxChildren(0);
    setPaxInfants(0);
    setBudget("");
    setAirline("");
    setCabin("");
    setStatus("New");
    setAssignedTo("");
    setFollowUpAt("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError("Full name required.");
      return;
    }

    startTransition(async () => {
      const res = await createLeadAction({
        full_name: clean(fullName),
        phone: clean(phone) || undefined,
        email: clean(email) || undefined,
        source: clean(source) || undefined,
        notes: clean(notes) || undefined,
        status,
        assigned_to: assignedTo ? assignedTo : null,
        follow_up_at: followUpAt ? new Date(followUpAt).toISOString() : null,

        // detail fields
        departure: clean(departure) || undefined,
        destination: clean(destination) || undefined,
        travel_date: travelDate ? new Date(travelDate).toISOString() : undefined,
        return_date: returnDate ? new Date(returnDate).toISOString() : undefined,
        pax_adults: paxAdults,
        pax_children: paxChildren,
        pax_infants: paxInfants,
        budget: clean(budget) || undefined,
        airline: clean(airline) || undefined,
        cabin: clean(cabin) || undefined,
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      setSuccess("Lead added successfully ✅");
      resetForm();
      onDone?.();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
      ) : null}

      {/* BASIC */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-zinc-600">Full Name *</label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Customer name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">Phone</label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92..."
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">Email</label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">Source</label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="web / call / whatsapp..."
          />
        </div>
      </div>

      {/* TRIP DETAIL */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-zinc-900">Trip Details</div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-600">Departure</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              placeholder="London"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Destination</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Lagos / Dubai / Jeddah..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Travel Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Return Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-zinc-600">Adults</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={paxAdults}
              onChange={(e) => setPaxAdults(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Children</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={paxChildren}
              onChange={(e) => setPaxChildren(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Infants</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={paxInfants}
              onChange={(e) => setPaxInfants(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-zinc-600">Budget</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="£ / Rs..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Preferred Airline</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              placeholder="Qatar / Emirates..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Cabin</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={cabin}
              onChange={(e) => setCabin(e.target.value)}
              placeholder="Economy / Business..."
            />
          </div>
        </div>
      </div>

      {/* PIPELINE */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-zinc-600">Status</label>
          <select
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Follow-Up">Follow-Up</option>
            <option value="Booked">Booked</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600">Assign to Agent</label>
          <select
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">{loadAgents ? "Loading..." : "Unassigned"}</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.email ?? a.id}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-zinc-600">Follow-up time</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={followUpAt}
            onChange={(e) => setFollowUpAt(e.target.value)}
          />
        </div>
      </div>

      {/* NOTES */}
      <div>
        <label className="text-xs font-medium text-zinc-600">Notes</label>
        <textarea
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Customer requirements..."
        />
      </div>

      <button
        disabled={!canSubmit || pending}
        className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Add Lead"}
      </button>
    </form>
  );
}
