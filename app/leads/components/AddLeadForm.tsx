"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createLeadAction } from "../actions";

type TripType = "oneway" | "return" | "multicity";

export default function AddLeadForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tripType, setTripType] = useState<TripType>("return");
  const [pending, startTransition] = useTransition();

  // ✅ If server action redirects to /leads?added=1, close modal & refresh UI
  useEffect(() => {
    const added = searchParams.get("added");
    if (added === "1") {
      onClose();
      router.replace("/leads"); // remove query param
      router.refresh();
    }
  }, [searchParams, onClose, router]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      // This will redirect on success or error (void return)
      await createLeadAction(formData);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {/* Customer Info */}
      <div>
        <div className="text-sm font-semibold text-zinc-900">Customer Info</div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-600">Full Name *</label>
            <input
              name="full_name"
              placeholder="Full name"
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Phone</label>
            <input
              name="phone"
              placeholder="+44..."
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Email</label>
            <input
              name="email"
              placeholder="name@email.com"
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>

      {/* Trip Details */}
      <div>
        <div className="text-sm font-semibold text-zinc-900">Trip Details</div>

        <div className="mt-3 grid grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-600">Trip Type</label>
            <select
              name="trip_type"
              value={tripType}
              onChange={(e) => setTripType(e.target.value as TripType)}
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
            >
              <option value="return">Return</option>
              <option value="oneway">One-way</option>
              <option value="multicity">Multi-city</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">From *</label>
            <input
              name="departure"
              placeholder="London"
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">To *</label>
            <input
              name="destination"
              placeholder="Lagos"
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Preferred Airline</label>
            <input
              name="preferred_airline"
              placeholder="Qatar, Turkish..."
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-600">Depart Date *</label>
            <input
              type="date"
              name="depart_date"
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Return Date</label>
            <input
              type="date"
              name="return_date"
              disabled={tripType !== "return"}
              className={`mt-1 h-11 w-full rounded-xl border px-4 text-sm outline-none ${
                tripType !== "return"
                  ? "border-zinc-100 bg-zinc-100 text-zinc-400"
                  : "border-zinc-200 bg-white focus:border-zinc-400"
              }`}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Cabin</label>
            <select
              name="cabin_class"
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
              defaultValue="economy"
            >
              <option value="economy">Economy</option>
              <option value="premium">Premium</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Budget</label>
            <input
              name="budget"
              placeholder="£..."
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>

      {/* Passengers & Priority */}
      <div>
        <div className="text-sm font-semibold text-zinc-900">Passengers & Priority</div>

        <div className="mt-3 grid grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-600">Adults *</label>
            <input
              type="number"
              name="adults"
              min={1}
              defaultValue={1}
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Children</label>
            <input
              type="number"
              name="children"
              min={0}
              defaultValue={0}
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Infants</label>
            <input
              type="number"
              name="infants"
              min={0}
              defaultValue={0}
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Priority</label>
            <select
              name="priority"
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
              defaultValue="warm"
            >
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">WhatsApp</label>
            <input
              name="whatsapp"
              placeholder="Optional"
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>

      {/* Follow-up */}
      <div>
        <div className="text-sm font-semibold text-zinc-900">Follow-up</div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-600">Follow-up Date</label>
            <input
              type="date"
              name="follow_up_date"
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs font-medium text-zinc-600">Notes</label>
            <input
              name="notes"
              placeholder="Optional notes..."
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold hover:bg-zinc-100"
          disabled={pending}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={pending}
        >
          {pending ? "Saving..." : "Save Lead"}
        </button>
      </div>
    </form>
  );
}
