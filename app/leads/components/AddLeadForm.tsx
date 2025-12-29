"use client";

import * as React from "react";
import { createLeadAction, listAgentsAction } from "../actions";
import type { Agent } from "../actions";

export default function AddLeadForm({
  onCreated,
  onClose,
}: {
  onCreated?: () => void;
  onClose?: () => void;
}) {
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [source, setSource] = React.useState("web");
  const [route, setRoute] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState<string>("");
  const [temperature, setTemperature] = React.useState("warm");

  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await listAgentsAction(); // ✅ returns Agent[]
      if (!mounted) return;
      setAgents(list);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await createLeadAction({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined, // ✅ null nahi
        email: email.trim() || undefined, // ✅ null nahi
        source: source.trim() || "web",
        route: route.trim() || undefined, // ✅ null nahi
        temperature: temperature.trim() || "warm",
        assigned_to: assignedTo.trim() || undefined,
      });

      if (!res.ok) {
        setError(res.error || "Failed to create lead.");
        return;
      }

      // reset
      setFullName("");
      setPhone("");
      setEmail("");
      setSource("web");
      setRoute("");
      setAssignedTo("");
      setTemperature("warm");

      onCreated?.();
      onClose?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name *</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Shehroz Malik"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Source</label>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="web">web</option>
            <option value="meta">meta</option>
            <option value="whatsapp">whatsapp</option>
            <option value="call">call</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Route</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            placeholder="e.g. LHR → DXB"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Assign to</label>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Temperature</label>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
          >
            <option value="cold">cold</option>
            <option value="warm">warm</option>
            <option value="hot">hot</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Saving..." : "Create Lead"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
