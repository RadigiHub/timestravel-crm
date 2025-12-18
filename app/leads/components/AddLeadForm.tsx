"use client";

import { useState } from "react";
import { createLeadAction } from "../actions";

export default function AddLeadForm() {
  const [tripType, setTripType] = useState<"oneway" | "return" | "multicity">("return");

  return (
    <form action={createLeadAction} className="flex flex-wrap items-center gap-3">
      {/* Name */}
      <input
        name="full_name"
        placeholder="Full name"
        className="h-11 w-[220px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
        required
      />

      {/* Phone */}
      <input
        name="phone"
        placeholder="Phone"
        className="h-11 w-[170px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
      />

      {/* Email */}
      <input
        name="email"
        placeholder="Email"
        className="h-11 w-[220px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
      />

      {/* Trip type */}
      <select
        name="trip_type"
        value={tripType}
        onChange={(e) => setTripType(e.target.value as any)}
        className="h-11 w-[160px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
      >
        <option value="return">Return</option>
        <option value="oneway">One-way</option>
        <option value="multicity">Multi-city</option>
      </select>

      {/* From / To */}
      <input
        name="departure"
        placeholder="From (e.g., London)"
        className="h-11 w-[200px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
        required
      />
      <input
        name="destination"
        placeholder="To (e.g., Lagos)"
        className="h-11 w-[200px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
        required
      />

      {/* Dates */}
      <input
        type="date"
        name="depart_date"
        className="h-11 w-[170px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
        required
      />

      <input
        type="date"
        name="return_date"
        disabled={tripType !== "return"}
        className={`h-11 w-[170px] rounded-xl border px-4 text-sm outline-none ${
          tripType !== "return"
            ? "border-zinc-100 bg-zinc-100 text-zinc-400"
            : "border-zinc-200 bg-white focus:border-zinc-400"
        }`}
      />

      {/* Pax */}
      <input
        type="number"
        name="adults"
        min={1}
        defaultValue={1}
        placeholder="Adults"
        className="h-11 w-[110px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
        required
      />
      <input
        type="number"
        name="children"
        min={0}
        defaultValue={0}
        placeholder="Child"
        className="h-11 w-[110px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
      />
      <input
        type="number"
        name="infants"
        min={0}
        defaultValue={0}
        placeholder="Infant"
        className="h-11 w-[110px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
      />

      {/* Cabin */}
      <select
        name="cabin_class"
        className="h-11 w-[160px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
        defaultValue="economy"
      >
        <option value="economy">Economy</option>
        <option value="premium">Premium</option>
        <option value="business">Business</option>
        <option value="first">First</option>
      </select>

      {/* Priority */}
      <select
        name="priority"
        className="h-11 w-[140px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
        defaultValue="warm"
      >
        <option value="hot">Hot</option>
        <option value="warm">Warm</option>
        <option value="cold">Cold</option>
      </select>

      {/* Extra */}
      <input
        name="preferred_airline"
        placeholder="Preferred airline"
        className="h-11 w-[190px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
      />
      <input
        name="budget"
        placeholder="Budget (optional)"
        className="h-11 w-[170px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
      />
      <input
        name="whatsapp"
        placeholder="WhatsApp (optional)"
        className="h-11 w-[190px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
      />

      <input
        type="date"
        name="follow_up_date"
        className="h-11 w-[170px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
        title="Follow-up date"
      />

      <input
        name="notes"
        placeholder="Notes (optional)"
        className="h-11 w-[260px] rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
      />

      {/* Submit */}
      <button
        type="submit"
        className="ml-auto h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Add Lead
      </button>
    </form>
  );
}
