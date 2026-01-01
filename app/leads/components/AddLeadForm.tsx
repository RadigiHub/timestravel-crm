"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createLeadAction, getAgentsAction } from "../actions";

type LeadStatus = "New" | "Contacted" | "Follow-Up" | "Booked" | "Lost";

type Agent = {
  id: string;
  name?: string | null;
  email?: string | null;
};

function clean(v?: string): string {
  return (v ?? "").trim();
}

function buildNotes(source?: string, notes?: string): string | undefined {
  const s = clean(source);
  const n = clean(notes);

  if (!s && !n) return undefined;
  if (s && n) return `Source: ${s}\n\n${n}`;
  if (s) return `Source: ${s}`;
  return n;
}

export default function AddLeadForm() {
  const [isPending, startTransition] = useTransition();

  // form state (detail wala)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<LeadStatus>("New");
  const [assignedTo, setAssignedTo] = useState<string>("");

  // ui state
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // agents
  const [agents, setAgents] = useState<Agent[]>([]);
  const hasAgents = agents.length > 0;

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res: any = await getAgentsAction();

        // handle both shapes:
        // 1) Agent[]
        // 2) { ok: true, data: Agent[] }
        // 3) fallback -> []
        let list: Agent[] = [];

        if (Array.isArray(res)) {
          list = res;
        } else if (res && typeof res === "object" && "ok" in res) {
          if (res.ok && Array.isArray(res.data)) list = res.data;
        } else if (res && typeof res === "object" && Array.isArray(res.data)) {
          list = res.data;
        }

        if (mounted) setAgents(list);
      } catch {
        if (mounted) setAgents([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const agentOptions = useMemo(() => {
    return agents.map((a) => ({
      id: a.id,
      label: a.name?.trim() || a.email?.trim() || a.id,
    }));
  }, [agents]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkMsg(null);

    const name = clean(fullName);
    const p = clean(phone);
    const em = clean(email);
    const noteValue = buildNotes(source, notes);

    if (!name) {
      setErr("Full name required.");
      return;
    }

    startTransition(async () => {
      try {
        // IMPORTANT:
        // schema/action expects: name, phone, email, notes, status, assigned_to
        // so full_name -> name
        const res = await createLeadAction({
          name,
          phone: p || undefined,
          email: em || undefined,
          notes: noteValue,
          status,
          assigned_to: assignedTo ? assignedTo : null,
        });

        if (!res?.ok) {
          setErr(res?.error || "Failed to create lead.");
          return;
        }

        setOkMsg("Lead created successfully ✅");
        setFullName("");
        setPhone("");
        setEmail("");
        setSource("");
        setNotes("");
        setStatus("New");
        setAssignedTo("");
      } catch (e: any) {
        setErr(e?.message || "Something went wrong.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <div className="text-base font-semibold text-zinc-900">Add Lead</div>
        <div className="text-sm text-zinc-600">
          Detail wala form — name/phone/email + source + notes + status + optional agent assign.
        </div>
      </div>

      {err ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {okMsg ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {okMsg}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Row 1 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-zinc-600">Full Name *</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ali Raza"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44..., 03..., etc"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-zinc-600">Source</label>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Facebook, WhatsApp, Website"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
            <div className="mt-1 text-[11px] text-zinc-500">
              Note: Source automatically notes me add ho jayega (schema safe).
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Follow-Up">Follow-Up</option>
              <option value="Booked">Booked</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">Assign Agent (optional)</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            >
              <option value="">{hasAgents ? "Unassigned" : "Unassigned (no agents found)"}</option>
              {agentOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            <div className="mt-1 text-[11px] text-zinc-500">
              Agar agents load na hon, form phir bhi work karega.
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-zinc-600">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any details: travel dates, budget, route, preferences, etc."
            rows={4}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Create Lead"}
          </button>

          <div className="text-xs text-zinc-500">
            Tip: “Source” + “Notes” combine ho kar notes field me save hota hai.
          </div>
        </div>
      </form>
    </div>
  );
}
