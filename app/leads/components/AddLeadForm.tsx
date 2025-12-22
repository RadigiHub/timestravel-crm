"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createLeadAction } from "../actions";

export default function AddLeadForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [tripType, setTripType] = useState<"oneway" | "return" | "multicity">("return");
  const [pending, setPending] = useState(false);

  async function action(formData: FormData) {
    setPending(true);
    try {
      await createLeadAction(formData); // must return void
      router.refresh(); // ✅ instantly re-fetch server data
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={action} className="px-6 py-5">
      <div className="mb-4">
        <div className="text-base font-semibold text-zinc-900">Add New Lead</div>
        <div className="text-sm text-zinc-500">Fill details clearly so follow-ups become easy.</div>
      </div>

      {/* Customer Info */}
      <div className="mb-5">
        <div className="mb-2 text-sm font-semibold text-zinc-900">Customer Info</div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Full Name *</label>
            <input
              name="full_name"
              required
              placeholder="e.g., Shehroz Malik"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Phone</label>
            <input
              name="phone"
              placeholder="+44..."
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
            <div className="mt-1 text-[11px] text-zinc-500">Optional — but recommended for quick contact.</div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Email</label>
            <input
              name="email"
              placeholder="email@example.com"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>

      {/* Trip Details */}
      <div className="mb-5">
        <div className="mb-2 text-sm font-semibold text-zinc-900">Trip Details</div>

        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Trip Type</label>
            <select
              name="trip_type"
              value={tripType}
              onChange={(e) => setTripType(e.target.value as any)}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            >
              <option value="return">Return</option>
              <option value="oneway">One-way</option>
              <option value="multicity">Multi-city</option>
            </select>
            <div className="mt-1 text-[11px] text-zinc-500">Multi-city: we’ll add legs detail next step.</div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">From *</label>
            <input
              name="departure"
              required
              placeholder="London"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">To *</label>
            <input
              name="destination"
              required
              placeholder="Lagos"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Preferred Airline</label>
            <input
              name="preferred_airline"
              placeholder="Qatar / BA"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Depart Date *</label>
            <input
              type="date"
              name="depart_date"
              required
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Return Date</label>
            <input
              type="date"
              name="return_date"
              disabled={tripType !== "return"}
              className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
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
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
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
              placeholder="£ / Rs"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>

      {/* Pax + Priority */}
      <div className="mb-5">
        <div className="mb-2 text-sm font-semibold text-zinc-900">Passengers & Priority</div>
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Adults *</label>
            <input
              type="number"
              name="adults"
              min={1}
              defaultValue={1}
              required
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Children</label>
            <input
              type="number"
              name="children"
              min={0}
              defaultValue={0}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Infants</label>
            <input
              type="number"
              name="infants"
              min={0}
              defaultValue={0}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Priority</label>
            <select
              name="priority"
              defaultValue="warm"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
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
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>

      {/* Follow-up + Notes */}
      <div className="mb-2">
        <div className="mb-2 text-sm font-semibold text-zinc-900">Follow-up</div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Follow-up Date</label>
            <input
              type="date"
              name="follow_up_date"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
            <div className="mt-1 text-[11px] text-zinc-500">Set a reminder date for callbacks.</div>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-600">Notes</label>
            <input
              name="notes"
              placeholder="Any extra details..."
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
        <div className="text-xs text-zinc-500">
          Tip: Phone + notes fill karoge to team follow-up fast ho jata hai.
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-xl bg-black px-5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save Lead"}
          </button>
        </div>
      </div>
    </form>
  );
}
