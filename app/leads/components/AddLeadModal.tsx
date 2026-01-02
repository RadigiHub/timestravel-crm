"use client";

import { useEffect, useState } from "react";
import AddLeadForm from "./AddLeadForm";
import type { LeadStatus } from "../actions";

export default function AddLeadModal({ onDone }: { onDone?: () => void }) {
  const [open, setOpen] = useState(false);

  // agar tumhare page se statuses aati hain to yahan plug kar lena,
  // abhi safe default
  const [statuses, setStatuses] = useState<LeadStatus[] | undefined>(undefined);
  const [defaultStatusId, setDefaultStatusId] = useState<string>("New");

  useEffect(() => {
    // optional future: fetch statuses from DB
    setStatuses(undefined);
    setDefaultStatusId("New");
  }, []);

  return (
    <>
      <button
        className="rounded-md bg-black px-3 py-2 text-white"
        onClick={() => setOpen(true)}
      >
        + Add Lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div className="font-semibold">Create Lead</div>
              <button
                className="rounded-md border px-3 py-1"
                onClick={() => setOpen(false)}
              >
                Close
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
      )}
    </>
  );
}
