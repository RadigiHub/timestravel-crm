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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative z-10 w-[980px] max-w-[95vw] rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <div className="text-lg font-semibold text-zinc-900">Add New Lead</div>
            <div className="text-xs text-zinc-500">
              Fill details clearly so follow-ups become easy.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AddLeadForm onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
