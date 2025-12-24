"use client";

import * as React from "react";
import { createLeadAction } from "../actions";

type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status_id: string;
  position: number;
  priority: "hot" | "warm" | "cold";
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export default function AddLeadForm({
  defaultStatusId,
  onCreated,
  onCancel,
}: {
  defaultStatusId: string;
  onCreated: (lead: Lead) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Customer
  const [full_name, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [source, setSource] = React.useState("web");
  const [priority, setPriority] = React.useState<"hot" | "warm" | "cold">("warm");

  // Travel (required by server action validation above)
  const [trip_type, setTripType] = React.useState<"oneway" | "return" | "multicity">("return");
  const [departure, setDeparture] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [depart_date, setDepartDate] = React.useState("");
  const [return_date, setReturnDate] = React.useState("");

  const [adults, setAdults] = React.useState(1);
  const [children, setChildren] = React.useState(0);
  const [infants, setInfants] = React.useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!full_name.trim()) return setError("Full name is required.");
    if (!departure.trim()) return setError("Departure is required.");
    if (!destination.trim()) return setError("Destination is required.");
    if (!depart_date.trim()) return setError("Depart date is required.");
    if (trip_type === "return" && !return_date.trim()) return setError("Return date is required.");

    setLoading(true);

    const res = await createLeadAction({
      full_name: full_name.trim(),
      phone: phone.trim() ? phone.trim() : null,
      email: email.trim() ? email.trim() : null,
      source: source.trim() ? source.trim() : "web",
      priority,
      status_id: defaultStatusId,

      trip_type,
      departure: departure.trim(),
      destination: destination.trim(),
      depart_date: depart_date.trim(),
      return_date: trip_type === "return" ? return_date.trim() : null,

      adults,
      children,
      infants,
    });

    setLoading(false);

    if (!res.ok) {
      setError(res.error ?? "Failed to create lead.");
      return;
    }

    onCreated(res.lead as unknown as Lead);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Customer */}
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

      {/* Travel */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3">
        <div className="mb-2 text-sm font-semibold text-zinc-900">Travel Details</div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-800">Trip Type</label>
            <select
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={trip_type}
              onChange={(e) => setTripType(e.target.value as any)}
            >
              <option value="return">return</option>
              <option value="oneway">oneway</option>
              <option value="multicity">multicity</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Adults</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Children</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">Infants</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={infants}
                onChange={(e) => setInfants(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-800">Departure *</label>
            <input
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              placeholder="e.g. London (LHR)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-800">Destination *</label>
            <input
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Lagos (LOS)"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-800">Depart Date *</label>
            <input
              type="date"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={depart_date}
              onChange={(e) => setDepartDate(e.target.value)}
            />
          </div>

          <div className={trip_type !== "return" ? "opacity-50 pointer-events-none" : ""}>
            <label className="mb-1 block text-sm font-medium text-zinc-800">Return Date *</label>
            <input
              type="date"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={return_date}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
        </div>
      </div>

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
