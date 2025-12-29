"use client";

import * as React from "react";
import { createLeadAction, listAgentsAction } from "../actions";
import type { Agent } from "../actions";

type Props = {
  onCreated?: () => void;
};

export default function AddLeadForm({ onCreated }: Props) {
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = React.useState(true);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // form fields
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [source, setSource] = React.useState<string>("web");
  const [route, setRoute] = React.useState("");
  const [temperature, setTemperature] = React.useState<"cold" | "warm" | "hot">("warm");
  const [assignedTo, setAssignedTo] = React.useState<string>("");

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingAgents(true);
        const list = await listAgentsAction(); // ✅ this returns Agent[]
        if (!mounted) return;
        setAgents(Array.isArray(list) ? list : []);
      } catch (e: any) {
        // silent fail (form still works)
        if (!mounted) return;
        setAgents([]);
      } finally {
        if (!mounted) return;
        setLoadingAgents(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // basic validation
    if (!fullName.trim()) return setError("Name is required.");
    if (!phone.trim() && !email.trim()) return setError("Phone or Email is required.");

    try {
      setSubmitting(true);

      const res = await createLeadAction({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        source: source.trim() || "web",
        route: route.trim() || null,
        temperature,
        assigned_to: assignedTo || null,
        status: "New",
      });

      // Support both patterns:
      // 1) { ok: true }
      // 2) throws error
      if ((res as any)?.ok === false) {
        setError((res as any)?.error || "Failed to create lead.");
        return;
      }

      // reset
      setFullName("");
      setPhone("");
      setEmail("");
      setSource("web");
      setRoute("");
      setTemperature("warm");
      setAssignedTo("");

      onCreated?.();
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Full Name *</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g. Shehroz Malik"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="+92..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="name@email.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="web">web</option>
            <option value="Meta">Meta</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Call">Call</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Referral">Referral</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Route</label>
          <input
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g. LHR → DXB"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Temperature</label>
          <select
            value={temperature}
            onChange={(e) => setTemperature(e.target.value as any)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="cold">Cold</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm font-medium">Assign To</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            disabled={loadingAgents}
          >
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {loadingAgents ? (
            <p className="text-xs text-gray-500 mt-1">Loading agents...</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Adding..." : "Add Lead"}
        </button>
      </div>
    </form>
  );
}
