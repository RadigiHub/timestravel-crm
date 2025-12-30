"use client";

import * as React from "react";
import { createLeadAction, listAgentsAction } from "../actions";
import type { Agent } from "../actions";

type Props = {
  // some older versions of AddLeadModal pass statuses; keep optional for compatibility
  statuses?: any;

  defaultStatusId: string;
  onCreated: (lead: any) => void;
  onCancel?: () => void;
};

// ✅ IMPORTANT: backend expects lowercase
type Priority = "cold" | "warm" | "hot";

function clean(v: string) {
  const t = (v ?? "").trim();
  return t.length ? t : undefined;
}

function toIntOrUndefined(v: string) {
  const n = Number((v ?? "").trim());
  return Number.isFinite(n) ? n : undefined;
}

export default function AddLeadForm({ defaultStatusId, onCreated, onCancel }: Props) {
  const [loading, setLoading] = React.useState(false);

  // Core fields
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [source, setSource] = React.useState("web");
  const [priority, setPriority] = React.useState<Priority>("warm");
  const [assignTo, setAssignTo] = React.useState<string>(""); // "" => unassigned

  // Full CRM fields (extra)
  const [fromCity, setFromCity] = React.useState("");
  const [toCity, setToCity] = React.useState("");
  const [routeManual, setRouteManual] = React.useState(""); // manual route override

  const [tripType, setTripType] = React.useState<"Return" | "One-way" | "Multi-city">("Return");
  const [departDate, setDepartDate] = React.useState("");
  const [returnDate, setReturnDate] = React.useState("");

  const [adults, setAdults] = React.useState("1");
  const [children, setChildren] = React.useState("0");
  const [infants, setInfants] = React.useState("0");

  const [budget, setBudget] = React.useState("");
  const [campaign, setCampaign] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Agents
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      setAgentsLoading(true);
      try {
        const res = await listAgentsAction();
        if (!mounted) return;

        // ✅ support both shapes safely:
        // - Agent[]
        // - { ok:true, agents:[...] } | { ok:false, error:string }
        if (Array.isArray(res)) {
          setAgents(res);
        } else if (res && typeof res === "object" && "ok" in res) {
          if ((res as any).ok) setAgents((res as any).agents || []);
          else setAgents([]);
        } else {
          setAgents([]);
        }
      } catch {
        if (mounted) setAgents([]);
      } finally {
        if (mounted) setAgentsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ We will NOT send "route" to createLeadAction (because CreateLeadInput doesn't have it).
  // We'll store everything inside notes block.
  const crmDetailsBlock = React.useMemo(() => {
    const lines: string[] = [];

    if (clean(tripType)) lines.push(`Trip Type: ${tripType}`);

    const from = clean(fromCity) || "-";
    const to = clean(toCity) || "-";
    if (from !== "-" || to !== "-") lines.push(`From/To: ${from} → ${to}`);

    if (clean(routeManual)) lines.push(`Route (manual): ${routeManual.trim()}`);

    if (clean(departDate)) lines.push(`Depart: ${departDate}`);
    if (tripType === "Return" && clean(returnDate)) lines.push(`Return: ${returnDate}`);

    const a = toIntOrUndefined(adults);
    const c = toIntOrUndefined(children);
    const i = toIntOrUndefined(infants);
    if (a != null || c != null || i != null) {
      lines.push(`PAX: Adults ${a ?? 0}, Children ${c ?? 0}, Infants ${i ?? 0}`);
    }

    if (clean(budget)) lines.push(`Budget: ${budget.trim()}`);
    if (clean(campaign)) lines.push(`Campaign: ${campaign.trim()}`);

    if (clean(notes)) lines.push(`Notes: ${notes.trim()}`);

    if (!lines.length) return undefined;

    return `--- CRM Details ---\n${lines.join("\n")}\n--- End ---`;
  }, [tripType, fromCity, toCity, routeManual, departDate, returnDate, adults, children, infants, budget, campaign, notes]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;

    setLoading(true);
    try {
      const res = await createLeadAction({
        full_name: fullName.trim(),
        phone: clean(phone),
        email: clean(email),
        source: clean(source) || "web",
        priority, // ✅ now matches backend type: "hot" | "warm" | "cold"
        status_id: defaultStatusId,
        assigned_to: clean(assignTo),

        // ✅ DO NOT send route here (not in CreateLeadInput)
        notes: crmDetailsBlock,
      });

      if (res && typeof res === "object" && "ok" in res && (res as any).ok) {
        onCreated((res as any).lead);
      } else {
        alert((res as any)?.error || "Failed to create lead.");
      }
    } finally {
      setLoading(false);
    }
  }

  const agentLabel = (a: Agent) => {
    const anyA = a as any;
    return anyA.full_name || anyA.name || anyA.email || a.id;
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-sm font-medium">Full Name *</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g., Ali Khan"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g., +44..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g., name@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Source / Priority / Assign */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium">Source</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="web / Meta / WhatsApp"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Priority</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="cold">Cold</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Assign To</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            disabled={agentsLoading}
          >
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {agentLabel(a)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trip type + Cities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium">Trip Type</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={tripType}
            onChange={(e) => setTripType(e.target.value as any)}
          >
            <option value="Return">Return</option>
            <option value="One-way">One-way</option>
            <option value="Multi-city">Multi-city</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">From</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g., London"
            value={fromCity}
            onChange={(e) => setFromCity(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">To</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g., Lagos"
            value={toCity}
            onChange={(e) => setToCity(e.target.value)}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Departure Date</label>
          <input
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={departDate}
            onChange={(e) => setDepartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Return Date</label>
          <input
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            disabled={tripType !== "Return"}
          />
        </div>
      </div>

      {/* Pax */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium">Adults</label>
          <input
            inputMode="numeric"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Children</label>
          <input
            inputMode="numeric"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={children}
            onChange={(e) => setChildren(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Infants</label>
          <input
            inputMode="numeric"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={infants}
            onChange={(e) => setInfants(e.target.value)}
          />
        </div>
      </div>

      {/* Route + Budget + Campaign */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium">Route (manual optional)</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Override: MAN → LOS"
            value={routeManual}
            onChange={(e) => setRouteManual(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Budget (optional)</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g., £450"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Campaign (optional)</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Meta - Africa Leads - Dec"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium">Notes</label>
        <textarea
          className="mt-1 w-full rounded-md border px-3 py-2 min-h-[90px]"
          placeholder="Any extra details..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          className="rounded-md border px-4 py-2"
          onClick={() => onCancel?.()}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-black text-white px-4 py-2"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Lead"}
        </button>
      </div>
    </form>
  );
}
