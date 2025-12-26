"use client";

import * as React from "react";
import AddLeadForm from "./AddLeadForm";
import type { Lead } from "../actions";

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
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Modal shell */}
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[85vh] overflow-hidden">
            {/* Header sticky */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
              <div className="text-base font-semibold text-zinc-900">Add New Lead</div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Body scroll */}
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-64px)]">
              <AddLeadForm
                defaultStatusId={defaultStatusId}
                onCancel={() => setOpen(false)}
                onCreated={(lead) => {
                  onCreated(lead);
                  setOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
