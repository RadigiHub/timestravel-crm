"use client";

import AddLeadForm from "./AddLeadForm";

export default function AddLeadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Add New Lead</div>
              <div className="text-xs text-zinc-500">Fill travel details & customer info.</div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              Close ✕
            </button>
          </div>

          <AddLeadForm onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
