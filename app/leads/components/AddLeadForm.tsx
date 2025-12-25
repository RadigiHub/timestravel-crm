"use client";

import * as React from "react";
import { createLeadAction } from "../actions";
import type { Lead } from "../actions";

export default function AddLeadForm({
  defaultStatusId,
  onCreated,
  onCancel,
}: {
  defaultStatusId: string;
  onCreated: (lead: Lead) => void;
  onCancel: () => void;
}) {
  const [full_name, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [source, setSource] = React.useState("web");
  const [priority, setPriority] = React.useState<"hot" | "warm" | "cold">("warm");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    setLoading(true);

    const res = await createLeadAction({
      full_name: full_name.trim(),
      phone: phone.trim() ? phone.trim() : null,
      email: email.trim() ? email.trim() : null,
      source: source.trim() ? source.trim() : null,
      priority,
      status_id: defaultStatusId,
    });

    setLoading(false);

    if (!res.ok) {
      setError(res.error ?? "Failed to create lead.");
      return;
    }

    onCreated(res.lead);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800">Full Name *</label>
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          value={full_name}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Shehroz Malik"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-800">Phone</label>
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+44..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-800">Email</label>
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-800">Source</label>
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="web / whatsapp / call / facebook"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-800">Priority</label>
          <select
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
          >
            <option value="hot">hot</option>
            <option value="warm">warm</option>
            <option value="cold">cold</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Lead"}
        </button>
      </div>
    </form>
  );
}
