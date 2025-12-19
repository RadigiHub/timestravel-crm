"use client";

import { useEffect } from "react";
import AddLeadForm from "./AddLeadForm";

export default function AddLeadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-auto mt-10 w-[min(980px,92vw)] rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-6">
          <div>
            <div className="text-xl font-semibold text-zinc-900">Add New Lead</div>
            <div className="mt-1 text-sm text-zinc-500">
              Fill travel details — we’ll keep it structured & clear.
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AddLeadForm />
        </div>
      </div>
    </div>
  );
}
