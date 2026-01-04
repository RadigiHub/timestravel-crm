"use client";

import { useState } from "react";
import AddLeadForm from "./AddLeadForm";
import type { Agent, Brand } from "../actions";

export default function AddLeadModal({ agents, brands }: { agents: Agent[]; brands: Brand[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-xl bg-black px-4 py-2 text-white">
        + Add Lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="text-lg font-semibold">Add New Lead</div>
              <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-1 hover:bg-zinc-100">
                ✕
              </button>
            </div>

            <div className="p-4">
              <AddLeadForm agents={agents} brands={brands} onDone={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
