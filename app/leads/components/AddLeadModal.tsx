"use client";

import { useMemo, useState } from "react";
import AddLeadForm from "./AddLeadForm";
import type { LeadStatus } from "../actions";

export default function AddLeadModal({ onDone }: { onDone?: () => void }) {
  const [open, setOpen] = useState(false);

  const statuses = useMemo<LeadStatus[]>(
    () => ["New", "Contacted", "Follow-Up", "Booked", "Lost"],
    []
  );

  const defaultStatusId = "New";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        + Add Lead
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-4">
              <div className="text-sm font-semibold text-zinc-900">
                Add New Lead
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <AddLeadForm
                statuses={statuses}
                defaultStatusId={defaultStatusId}
                onCancel={() => setOpen(false)}
                onCreated={() => {
                  setOpen(false);
                  onDone?.();
                }}
                onDone={() => {
                  setOpen(false);
                  onDone?.();
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
