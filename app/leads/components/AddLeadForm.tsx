"use client";

import * as React from "react";
import { createLeadAction, getAgentsAction } from "../actions";
import type { Lead, CreateLeadInput, CreateLeadResult, Agent } from "../actions";

export default function AddLeadForm({
  defaultStatusId,
  onCreated,
  onCancel,
}: {
  defaultStatusId: string;
  onCreated: (lead: Lead) => void;
  onCancel: () => void;
}) {
  // basic
  const [full_name, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [source, setSource] = React.useState("web");
  const [priority, setPriority] = React.useState<"hot" | "warm" | "cold">("warm");

  // assignment
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [assignedTo, setAssignedTo] = React.useState<string>(""); // uuid or ""
  const [agentRoleFilter, setAgentRoleFilter] = React.useState<"all" | "b2c" | "b2b">("all");

  // travel + notes
  const [showTravel, setShowTravel] = React.useState(true);

  const [tripType, setTripType] = React.useState<"oneway" | "return" | "multicity">("return");
  const [cabinClass, setCabinClass] = React.useState<"economy" | "premium" | "business" | "first">("economy");

  const [departure, setDeparture] = React.useState("");
  const [destination, setDestination] = React.useState("");

  const [departDate, setDepartDate] = React.useState("");
  const [returnDate, setReturnDate] = React.useState("");

  const [adults, setAdults] = React.useState<number>(1);
  const [children, setChildren] = React.useState<number>(0);
  const [infants, setInfants] = React.useState<number>(0);

  const [budget, setBudget] = React.useState("");
  const [preferredAirline, setPreferredAirline] = React.useState("");

  const [whatsapp, setWhatsapp] = React.useState("");
  const [followUpDate, setFollowUpDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [whatsappText, setWhatsappText] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // load agents
  React.useEffect(() => {
    (async () => {
      const res = await getAgentsAction();
      if (res.ok) setAgents(res.agents);
    })();
  }, []);

  const filteredAgents = React.useMemo(() => {
    if (agentRoleFilter === "all") return agents;
    return agents.filter((a) => (a.role ?? "").toLowerCase() === agentRoleFilter);
  }, [agents, agentRoleFilter]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = full_name.trim();
    if (!name) {
      setError("Full name is required.");
      return;
    }

    const payload: CreateLeadInput = {
      full_name: name,
      phone: phone.trim() ? phone.trim() : null,
      email: email.trim() ? email.trim() : null,
      source: source.trim() ? source.trim() : null,
      priority,
      status_id: defaultStatusId,

      assigned_to: assignedTo ? assignedTo : null,

      // travel fields
      trip_type: tripType,
      cabin_class: cabinClass,

      departure: departure.trim() ? departure.trim() : null,
      destination: destination.trim() ? destination.trim() : null,

      depart_date: departDate ? departDate : null,
      return_date: returnDate ? returnDate : null,

      adults: Number.isFinite(adults) ? adults : 1,
      children: Number.isFinite(children) ? children : 0,
      infants: Number.isFinite(infants) ? infants : 0,

      budget: budget.trim() ? budget.trim() : null,
      preferred_airline: preferredAirline.trim() ? preferredAirline.trim() : null,

      whatsapp: whatsapp.trim() ? whatsapp.trim() : null,
      follow_up_date: followUpDate ? followUpDate : null,

      notes: notes.trim() ? notes.trim() : null,
      whatsapp_text: whatsappText.trim() ? whatsappText.trim() : null,
    };

    setLoading(true);
    const res = (await createLeadAction(payload)) as CreateLeadResult;
    setLoading(false);

    if (!res.ok) {
      setError(res.error ?? "Failed to create lead.");
      return;
    }

    onCreated(res.lead);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* BASIC */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800">Full Name *</label>
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          value={full_name}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Shehroz Malik"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-800">Phone</label>
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+44..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-800">Email</label>
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-800">Source</label>
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="web / whatsapp / call / facebook"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-800">Priority</label>
          <select
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
          >
            <option value="hot">hot</option>
            <option value="warm">warm</option>
            <option value="cold">cold</option>
          </select>
        </div>
      </div>

      {/* ASSIGN */}
      <div className="rounded-2xl border border-zinc-200 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-900">Assignment</div>
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded-lg px-2 py-1 text-xs border ${agentRoleFilter === "all" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200"}`}
              onClick={() => setAgentRoleFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`rounded-lg px-2 py-1 text-xs border ${agentRoleFilter === "b2c" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200"}`}
              onClick={() => setAgentRoleFilter("b2c")}
            >
              B2C
            </button>
            <button
              type="button"
              className={`rounded-lg px-2 py-1 text-xs border ${agentRoleFilter === "b2b" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200"}`}
              onClick={() => setAgentRoleFilter("b2b")}
            >
              B2B
            </button>
          </div>
        </div>

        <label className="mb-1 block text-sm font-medium text-zinc-800">Assign To (optional)</label>
        <select
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        >
          <option value="">Unassigned</option>
          {filteredAgents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name ?? a.id} {a.role ? `(${a.role})` : ""}
            </option>
          ))}
        </select>

        <div className="mt-2 text-xs text-zinc-500">
          Note: Agents list “profiles” table se aati hai. Role: <span className="font-medium">b2c</span> / <span className="font-medium">b2b</span>.
        </div>
      </div>

      {/* TOGGLE */}
      <button
        type="button"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
        onClick={() => setShowTravel((v) => !v)}
      >
        {showTravel ? "Hide Travel / Notes" : "Show Travel / Notes"}
      </button>

      {showTravel && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Trip Type</label>
              <select
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={tripType}
                onChange={(e) => setTripType(e.target.value as any)}
              >
                <option value="return">return</option>
                <option value="oneway">oneway</option>
                <option value="multicity">multicity</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Cabin Class</label>
              <select
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={cabinClass}
                onChange={(e) => setCabinClass(e.target.value as any)}
              >
                <option value="economy">economy</option>
                <option value="premium">premium</option>
                <option value="business">business</option>
                <option value="first">first</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Departure</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                placeholder="e.g. London (LHR)"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Destination</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Lagos (LOS)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Depart Date</label>
              <input
                type="date"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Return Date</label>
              <input
                type="date"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Adults</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value || "1", 10))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Children</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value || "0", 10))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Infants</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={infants}
                onChange={(e) => setInfants(parseInt(e.target.value || "0", 10))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Budget</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. £650 - £900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Preferred Airline</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={preferredAirline}
                onChange={(e) => setPreferredAirline(e.target.value)}
                placeholder="e.g. Emirates / Qatar / BA"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">WhatsApp</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+44..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Follow-up Date</label>
              <input
                type="date"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-800">Notes</label>
            <textarea
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 min-h-[90px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any customer notes..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-800">WhatsApp Text</label>
            <textarea
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 min-h-[70px]"
              value={whatsappText}
              onChange={(e) => setWhatsappText(e.target.value)}
              placeholder="Message template (optional)"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Lead"}
        </button>
      </div>
    </form>
  );
}
