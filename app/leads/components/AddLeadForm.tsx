"use client";

import { useEffect, useMemo, useState } from "react";
import { createLeadAction } from "../actions";

type TripType = "oneway" | "return" | "multicity";

function FieldLabel({ children }: { children: string }) {
  return <div className="mb-1 text-xs font-semibold text-zinc-700">{children}</div>;
}

function HelpText({ children }: { children: string }) {
  return <div className="mt-1 text-[11px] text-zinc-500">{children}</div>;
}

export default function AddLeadForm() {
  const [open, setOpen] = useState(false);
  const [tripType, setTripType] = useState<TripType>("return");

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // when trip type changes away from return, return_date will be disabled anyway
  const returnDisabled = useMemo(() => tripType !== "return", [tripType]);

  return (
    <div className="mb-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <div>
          <div className="text-sm font-semibold text-zinc-900">Leads</div>
          <div className="text-xs text-zinc-500">
            Add a lead, then drag & drop cards between stages.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-10 rounded-xl bg-black px-4 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            + Add Lead
          </button>
        </div>
      </div>

      {/* Modal */}
      {open ? (
        <div className="fixed inset-0 z-50">
          {/* overlay */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          {/* panel */}
          <div className="absolute left-1/2 top-1/2 w-[96vw] max-w-3xl -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-xl">
              {/* header */}
              <div className="flex items-start justify-between gap-3 border-b border-zinc-100 p-5">
                <div>
                  <div className="text-base font-semibold text-zinc-900">Add New Lead</div>
                  <div className="text-xs text-zinc-500">
                    Fill details clearly so follow-ups become easy.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Close ✕
                </button>
              </div>

              {/* form */}
              <form action={createLeadAction} className="p-5">
                {/* Section: Customer */}
                <div className="mb-5">
                  <div className="mb-3 text-sm font-semibold text-zinc-900">Customer Info</div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="md:col-span-1">
                      <FieldLabel>Full Name *</FieldLabel>
                      <input
                        name="full_name"
                        placeholder="e.g., Ali Khan"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                        required
                      />
                    </div>

                    <div className="md:col-span-1">
                      <FieldLabel>Phone</FieldLabel>
                      <input
                        name="phone"
                        placeholder="e.g., +44..."
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      />
                      <HelpText>Optional — but recommended for quick contact.</HelpText>
                    </div>

                    <div className="md:col-span-1">
                      <FieldLabel>Email</FieldLabel>
                      <input
                        name="email"
                        placeholder="e.g., name@email.com"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Trip */}
                <div className="mb-5">
                  <div className="mb-3 text-sm font-semibold text-zinc-900">Trip Details</div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="md:col-span-1">
                      <FieldLabel>Trip Type</FieldLabel>
                      <select
                        name="trip_type"
                        value={tripType}
                        onChange={(e) => setTripType(e.target.value as TripType)}
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      >
                        <option value="return">Return</option>
                        <option value="oneway">One-way</option>
                        <option value="multicity">Multi-city</option>
                      </select>
                      <HelpText>Multi-city: we’ll add legs detail next step.</HelpText>
                    </div>

                    <div className="md:col-span-1">
                      <FieldLabel>From *</FieldLabel>
                      <input
                        name="departure"
                        placeholder="London"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                        required
                      />
                    </div>

                    <div className="md:col-span-1">
                      <FieldLabel>To *</FieldLabel>
                      <input
                        name="destination"
                        placeholder="Lagos"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                        required
                      />
                    </div>

                    <div className="md:col-span-1">
                      <FieldLabel>Preferred Airline</FieldLabel>
                      <input
                        name="preferred_airline"
                        placeholder="Any"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="md:col-span-1">
                      <FieldLabel>Depart Date *</FieldLabel>
                      <input
                        type="date"
                        name="depart_date"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                        required
                      />
                    </div>

                    <div className="md:col-span-1">
                      <FieldLabel>Return Date</FieldLabel>
                      <input
                        type="date"
                        name="return_date"
                        disabled={returnDisabled}
                        className={`h-11 w-full rounded-xl border px-4 text-sm outline-none ${
                          returnDisabled
                            ? "border-zinc-100 bg-zinc-100 text-zinc-400"
                            : "border-zinc-200 bg-white focus:border-zinc-400"
                        }`}
                      />
                      {returnDisabled ? <HelpText>Return date only for Return trips.</HelpText> : null}
                    </div>

                    <div className="md:col-span-1">
                      <FieldLabel>Cabin</FieldLabel>
                      <select
                        name="cabin_class"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                        defaultValue="economy"
                      >
                        <option value="economy">Economy</option>
                        <option value="premium">Premium</option>
                        <option value="business">Business</option>
                        <option value="first">First</option>
                      </select>
                    </div>

                    <div className="md:col-span-1">
                      <FieldLabel>Budget</FieldLabel>
                      <input
                        name="budget"
                        placeholder="e.g., £650"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Pax + Priority */}
                <div className="mb-5">
                  <div className="mb-3 text-sm font-semibold text-zinc-900">Passengers & Priority</div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div>
                      <FieldLabel>Adults *</FieldLabel>
                      <input
                        type="number"
                        name="adults"
                        min={1}
                        defaultValue={1}
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                        required
                      />
                    </div>

                    <div>
                      <FieldLabel>Children</FieldLabel>
                      <input
                        type="number"
                        name="children"
                        min={0}
                        defaultValue={0}
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>

                    <div>
                      <FieldLabel>Infants</FieldLabel>
                      <input
                        type="number"
                        name="infants"
                        min={0}
                        defaultValue={0}
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <FieldLabel>Priority</FieldLabel>
                      <select
                        name="priority"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                        defaultValue="warm"
                      >
                        <option value="hot">Hot</option>
                        <option value="warm">Warm</option>
                        <option value="cold">Cold</option>
                      </select>
                    </div>

                    <div className="md:col-span-1">
                      <FieldLabel>WhatsApp</FieldLabel>
                      <input
                        name="whatsapp"
                        placeholder="Optional"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Notes + Followup */}
                <div className="mb-1">
                  <div className="mb-3 text-sm font-semibold text-zinc-900">Follow-up</div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="md:col-span-1">
                      <FieldLabel>Follow-up Date</FieldLabel>
                      <input
                        type="date"
                        name="follow_up_date"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      />
                      <HelpText>Set a reminder date for callbacks.</HelpText>
                    </div>

                    <div className="md:col-span-2">
                      <FieldLabel>Notes</FieldLabel>
                      <input
                        name="notes"
                        placeholder="Any extra details (timings, preferred airline, flexible dates, etc.)"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>
                </div>

                {/* footer */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                  <div className="text-xs text-zinc-500">
                    Tip: Phone + notes fill karoge to team follow-up fast ho jata hai.
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="h-11 rounded-xl bg-black px-6 text-sm font-semibold text-white hover:bg-zinc-800"
                    >
                      Save Lead
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
