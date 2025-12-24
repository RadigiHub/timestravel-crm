"use client";

import * as React from "react";
import AddLeadForm from "./AddLeadForm";

type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status_id: string;
  position: number;
  priority: "hot" | "warm" | "cold";
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export default function AddLeadModal({
  defaultStatusId,
  onCreated,
}: {
  defaultStatusId: string;
  onCreated: (lead: Lead) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        onClick={() => setOpen(true)}
      >
        + Add Lead
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            // click outside to close
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div className="text-base font-semibold text-zinc-900">Add New Lead</div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <AddLeadForm
                defaultStatusId={defaultStatusId}
                onCreated={(lead) => {
                  onCreated(lead);
                  setOpen(false);
                }}
                onCancel={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
