"use client";

import * as React from "react";
import { createLeadAction, listAgentsAction } from "../actions";
import type { Agent } from "../actions";

type Props = {
  defaultStatusId: string;
  onCreated: (lead: any) => void;
  onCancel?: () => void;
};

/**
 * UI ke liye Capital priority (nice UX)
 */
type PriorityUI = "Cold" | "Warm" | "Hot";

/**
 * Backend ke liye strict lowercase
 */
type PriorityDB = "cold" | "warm" | "hot";

function clean(v: string) {
  const t = v.trim();
  return t.length ? t : undefined;
}

/**
 * UI → DB mapper (❗️THIS FIXES YOUR ERROR)
 */
function mapPriorityToDB(p: PriorityUI): PriorityDB {
  return p.toLowerCase() as PriorityDB;
}

export default function AddLeadForm({
  defaultStatusId,
  onCreated,
  onCancel,
}: Props) {
  const [loading, setLoading] = React.useState(false);

  // Core fields
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [source, setSource] = React.useState("web");
  const [priority, setPriority] = React.useState<PriorityUI>("Warm");
  const [assignTo, setAssignTo] = React.useState("");

  // Full CRM fields
  const [fromCity, setFromCity] = React.useState("");
  const [toCity, setToCity] = React.useState("");
  const [route, setRoute] = React.useState("");

  const [tripType, setTripType] =
    React.useState<"Return" | "One-way" | "Multi-city">("Return");

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
      const res = await listAgentsAction();
      if (!mounted) return;

      if (Array.isArray(res)) {
        setAgents(res);
      } else if (res && typeof res === "object" && "ok" in res) {
        if ((res as any).ok) setAgents((res as any).agents || []);
        else setAgents([]);
      } else {
        setAgents([]);
      }

      setAgentsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const effectiveRoute =
    clean(route) ||
    [clean(fromCity), clean(toCity)].filter(Boolean).join(" → ") ||
    undefined;

  const fullCrmNotesBlock = React.useMemo(() => {
    const lines: string[] = [];

    lines.push(`Priority: ${priority}`);
    lines.push(`Trip Type: ${tripType}`);

    if (clean(fromCity) || clean(toCity)) {
      lines.push(
        `From/To: ${clean(fromCity) || "-"} → ${clean(toCity) || "-"}`
      );
    }

    if (clean(departDate)) lines.push(`Depart: ${departDate}`);
    if (tripType === "Return" && clean(returnDate))
      lines.push(`Return: ${returnDate}`);

    lines.push(
      `PAX: Adults ${adults}, Children ${children}, Infants ${infants}`
    );

    if (clean(budget)) lines.push(`Budget: ${budget}`);
    if (clean(campaign)) lines.push(`Campaign: ${campaign}`);
    if (clean(notes)) lines.push(`Notes: ${notes}`);

    return `--- CRM Details ---\n${lines.join("\n")}\n--- End ---`;
  }, [
    priority,
    tripType,
    fromCity,
    toCity,
    departDate,
    returnDate,
    adults,
    children,
    infants,
    budget,
    campaign,
    notes,
  ]);

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
        priority: mapPriorityToDB(priority), // ✅ FIX
        status_id: defaultStatusId,
        assigned_to: clean(assignTo),
        route: effectiveRoute,
        notes: fullCrmNotesBlock,
      });

      if (res && "ok" in res && res.ok) {
        onCreated(res.lead);
      } else {
        alert((res as any)?.error || "Failed to create lead.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Full Name */}
      <div>
        <label className="text-sm font-medium">Full Name *</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      {/* Phone / Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className="rounded-md border px-3 py-2"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="rounded-md border px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Source / Priority / Assign */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="rounded-md border px-3 py-2"
          placeholder="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />

        <select
          className="rounded-md border px-3 py-2"
          value={priority}
          onChange={(e) => setPriority(e.target.value as PriorityUI)}
        >
          <option value="Cold">Cold</option>
          <option value="Warm">Warm</option>
          <option value="Hot">Hot</option>
        </select>

        <select
          className="rounded-md border px-3 py-2"
          value={assignTo}
          onChange={(e) => setAssignTo(e.target.value)}
          disabled={agentsLoading}
        >
          <option value="">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name || a.email}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <textarea
        className="w-full rounded-md border px-3 py-2 min-h-[90px]"
        placeholder="Notes / CRM details"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="border rounded-md px-4 py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-black text-white rounded-md px-4 py-2"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Lead"}
        </button>
      </div>
    </form>
  );
}
