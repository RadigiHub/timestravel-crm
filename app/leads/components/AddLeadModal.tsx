"use client";

import { useState } from "react";
import AddLeadForm from "./AddLeadForm";

export default function AddLeadModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="rounded-lg bg-black px-4 py-2 text-white" onClick={() => setOpen(true)}>
        + Add Lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="text-lg font-semibold">Add New Lead</div>
              <button className="rounded-lg border px-3 py-1" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <div className="p-5">
              <AddLeadForm
                onCancel={() => setOpen(false)}
                onCreated={() => {
                  setOpen(false);
                  // board revalidatePath("/leads") already in server action
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
