"use client";

import { useFormStatus } from "react-dom";
import { createLeadAction } from "../actions";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Adding..." : "Add Lead"}
    </button>
  );
}

export default function AddLeadForm() {
  return (
    <form
      action={createLeadAction}
      className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <input
          name="full_name"
          placeholder="Full name"
          required
          className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
        />
        <input
          name="phone"
          placeholder="Phone"
          className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
        />
        <input
          name="email"
          placeholder="Email"
          type="email"
          className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
        />
        <select
          name="priority"
          className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
          defaultValue="warm"
        >
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>

        <div className="flex items-center justify-end">
          <SubmitBtn />
        </div>
      </div>
    </form>
  );
}
