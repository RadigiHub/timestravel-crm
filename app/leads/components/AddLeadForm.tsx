"use client";

import { useState } from "react";
import { createLeadAction } from "../actions";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`h-11 rounded-xl px-5 text-sm font-semibold text-white ${
        pending ? "bg-zinc-500" : "bg-black hover:bg-zinc-800"
      }`}
    >
      {pending ? "Saving..." : "Save Lead"}
    </button>
  );
}

export default function AddLeadForm() {
  const [open, setOpen] = useState(false);
  const [tripType, setTripType] = useState<"oneway" | "return" | "multicity">("return");

  return (
    <>
      {/* Top bar button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 rounded-xl bg-black px-4 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          + Add Lead
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* modal card */}
          <div className="relative z-10 w-[min(980px,92vw)] rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Add New Lead</h2>
                <p className="text-sm text-zinc-500">Fill details clearly so follow-ups become easy.</p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-100"
              >
                ✕ Close
              </button>
            </div>

            {/* IMPORTANT: button MUST be inside this form, and button type MUST be submit */}
            <form action={createLeadAction} className="px-6 py-5">
              {/* Customer Info */}
              <div className="mb-5">
                <div className="mb-2 text-sm font-semibold text-zinc-900">Customer Info</div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="full_name"
                      placeholder="e.g., Shehroz Malik"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">
                      Phone
                    </label>
                    <input
                      name="phone"
                      placeholder="+92..."
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    />
                    <div className="mt-1 text-[11px] text-zinc-500">Optional — but recommended for quick contact.</div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">
                      Email
                    </label>
                    <input
                      name="email"
                      placeholder="name@email.com"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    />
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="mb-5">
                <div className="mb-2 text-sm font-semibold text-zinc-900">Trip Details</div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Trip Type</label>
                    <select
                      name="trip_type"
                      value={tripType}
                      onChange={(e) => setTripType(e.target.value as any)}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    >
                      <option value="return">Return</option>
                      <option value="oneway">One-way</option>
                      <option value="multicity">Multi-city</option>
                    </select>
                    <div className="mt-1 text-[11px] text-zinc-500">
                      Multi-city: we’ll add legs detail next step.
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">
                      From <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="departure"
                      placeholder="e.g., London"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">
                      To <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="destination"
                      placeholder="e.g., Lagos"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Preferred Airline</label>
                    <input
                      name="preferred_airline"
                      placeholder="e.g., Qatar"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">
                      Depart Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="depart_date"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Return Date</label>
                    <input
                      type="date"
                      name="return_date"
                      disabled={tripType !== "return"}
                      className={`h-11 w-full rounded-xl border px-4 text-sm outline-none ${
                        tripType !== "return"
                          ? "border-zinc-100 bg-zinc-100 text-zinc-400"
                          : "border-zinc-200 bg-white focus:border-zinc-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Cabin</label>
                    <select
                      name="cabin_class"
                      defaultValue="economy"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    >
                      <option value="economy">Economy</option>
                      <option value="premium">Premium</option>
                      <option value="business">Business</option>
                      <option value="first">First</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Budget</label>
                    <input
                      name="budget"
                      placeholder="£ / PKR (optional)"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    />
                  </div>
                </div>
              </div>

              {/* Pax & Priority */}
              <div className="mb-5">
                <div className="mb-2 text-sm font-semibold text-zinc-900">Passengers & Priority</div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">
                      Adults <span className="text-red-500">*</span>
                    </label>
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
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Children</label>
                    <input
                      type="number"
                      name="children"
                      min={0}
                      defaultValue={0}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Infants</label>
                    <input
                      type="number"
                      name="infants"
                      min={0}
                      defaultValue={0}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Priority</label>
                    <select
                      name="priority"
                      defaultValue="warm"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    >
                      <option value="hot">Hot</option>
                      <option value="warm">Warm</option>
                      <option value="cold">Cold</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">WhatsApp</label>
                    <input
                      name="whatsapp"
                      placeholder="Optional"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    />
                  </div>
                </div>
              </div>

              {/* Follow-up */}
              <div className="mb-6">
                <div className="mb-2 text-sm font-semibold text-zinc-900">Follow-up</div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Follow-up Date</label>
                    <input
                      type="date"
                      name="follow_up_date"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    />
                    <div className="mt-1 text-[11px] text-zinc-500">Set a reminder date for callbacks.</div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600">Notes</label>
                    <input
                      name="notes"
                      placeholder="Any important details..."
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-xs text-zinc-500">
                  Tip: Phone + notes fill karoge to team follow-up fast ho jata hai.
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold hover:bg-zinc-100"
                  >
                    Cancel
                  </button>

                  <SubmitButton />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
