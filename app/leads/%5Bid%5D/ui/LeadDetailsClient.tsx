"use client";

import { useMemo, useState } from "react";
import {
  assignLeadAction,
  moveLeadAction,
  type Agent,
  type Brand,
  type Lead,
  type LeadStatus,
} from "@/app/leads/actions";

type LeadLog = {
  id: string;
  created_at: string;
  message: string;
};

type Props = {
  lead: Lead;
  agents: Agent[];
  brands?: Brand[];
  logs?: LeadLog[];
};

const STATUSES: LeadStatus[] = ["New", "Contacted", "Follow-Up", "Booked", "Lost"];

function safeText(v: any) {
  const s = (v ?? "").toString().trim();
  return s || "—";
}

function toWaPhone(phone: string) {
  // Keep digits only
  return phone.replace(/[^\d]/g, "");
}

function formatDateTime(dt: string) {
  // dt expected ISO string
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

export default function LeadDetailsClient({ lead, agents, brands = [], logs = [] }: Props) {
  const [busy, setBusy] = useState(false);

  const title = useMemo(() => {
    const n = (lead.full_name ?? "").trim();
    const p = (lead.phone ?? "").trim();
    const e = (lead.email ?? "").trim();
    return n || p || e || "Lead Details";
  }, [lead.full_name, lead.phone, lead.email]);

  const agentLabel = useMemo(() => {
    if (!lead.agent_id) return "Unassigned";
    const a = agents.find((x) => x.id === lead.agent_id);
    if (!a) return `Agent ${lead.agent_id.slice(0, 6)}`;
    const name = (a.full_name ?? "").trim();
    if (name) return name;
    const email = (a.email ?? "").trim();
    if (email) return email.split("@")[0] || email;
    return `Agent ${a.id.slice(0, 6)}`;
  }, [lead.agent_id, agents]);

  const brandLabel = useMemo(() => {
    if (!lead.brand_id) return "—";
    const b = brands.find((x) => x.id === lead.brand_id);
    return b?.name ?? "—";
  }, [lead.brand_id, brands]);

  const waLink = useMemo(() => {
    const p = (lead.phone ?? "").trim();
    if (!p) return null;
    const wa = toWaPhone(p);
    if (!wa) return null;

    const msg = encodeURIComponent(
      `Hi ${lead.full_name?.trim() || ""} — Times Travel here. Aap ki enquiry receive hui hai. ` +
        `Kindly apni travel dates aur route confirm kar dein?`
    );

    return `https://wa.me/${wa}?text=${msg}`;
  }, [lead.phone, lead.full_name]);

  async function changeStatus(next: LeadStatus) {
    setBusy(true);
    const res = await moveLeadAction({ id: lead.id, status: next });
    setBusy(false);
    if (!res.ok) alert(res.error);
    // simplest: refresh to show updated status
    if (res.ok) window.location.reload();
  }

  async function changeAgent(nextAgentId: string | null) {
    setBusy(true);
    const res = await assignLeadAction({ id: lead.id, agent_id: nextAgentId });
    setBusy(false);
    if (!res.ok) alert(res.error);
    if (res.ok) window.location.reload();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="text-2xl font-semibold text-zinc-900 truncate">{title}</div>
          <div className="mt-1 text-sm text-zinc-600">
            Created: <span className="text-zinc-800">{safeText(formatDateTime(lead.created_at))}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              WhatsApp
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed rounded-xl bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500"
              title="Phone missing"
            >
              WhatsApp
            </button>
          )}

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Top Controls */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-zinc-500">Status</div>
          <select
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            value={(lead.status ?? "New") as LeadStatus}
            onChange={(e) => changeStatus(e.target.value as LeadStatus)}
            disabled={busy}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {busy ? <div className="mt-2 text-xs text-zinc-500">Saving…</div> : null}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-zinc-500">Assigned Agent</div>
          <select
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            value={lead.agent_id ?? ""}
            onChange={(e) => changeAgent(e.target.value || null)}
            disabled={busy}
          >
            <option value="">Unassigned</option>
            {agents
              .slice()
              .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""))
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {(a.full_name ?? a.email ?? `Agent ${a.id.slice(0, 6)}`) as string}
                </option>
              ))}
          </select>

          <div className="mt-2 text-xs text-zinc-600">
            Current: <span className="text-zinc-800">{agentLabel}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-zinc-500">Brand</div>
          <div className="mt-2 text-sm font-medium text-zinc-900">{brandLabel}</div>
          <div className="mt-2 text-xs text-zinc-500">
            (Brand edit step next — abhi page compile + status/agent solid kar rahe hain.)
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-base font-semibold text-zinc-900">Customer</div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="text-zinc-500">Full name</div>
              <div className="text-zinc-900 font-medium text-right">{safeText(lead.full_name)}</div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="text-zinc-500">Phone</div>
              <div className="text-zinc-900 font-medium text-right">{safeText(lead.phone)}</div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="text-zinc-500">Email</div>
              <div className="text-zinc-900 font-medium text-right">{safeText(lead.email)}</div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="text-zinc-500">Source</div>
              <div className="text-zinc-900 font-medium text-right">{safeText(lead.source)}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-base font-semibold text-zinc-900">Trip</div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="text-zinc-500">Departure</div>
              <div className="text-zinc-900 font-medium text-right">{safeText(lead.departure)}</div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="text-zinc-500">Destination</div>
              <div className="text-zinc-900 font-medium text-right">{safeText(lead.destination)}</div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="text-zinc-500">Travel date</div>
              <div className="text-zinc-900 font-medium text-right">{safeText(lead.travel_date)}</div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="text-zinc-500">Return date</div>
              <div className="text-zinc-900 font-medium text-right">{safeText(lead.return_date)}</div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="text-zinc-500">Cabin</div>
              <div className="text-zinc-900 font-medium text-right">{safeText(lead.cabin)}</div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="text-zinc-500">Preferred airline</div>
              <div className="text-zinc-900 font-medium text-right">{safeText(lead.airline)}</div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="text-zinc-500">Budget</div>
              <div className="text-zinc-900 font-medium text-right">
                {lead.budget == null ? "—" : String(lead.budget)}
              </div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="text-zinc-500">Pax</div>
              <div className="text-zinc-900 font-medium text-right">
                A:{lead.pax_adults ?? 0} • C:{lead.pax_children ?? 0} • I:{lead.pax_infants ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-zinc-900">Notes</div>
        <div className="mt-2 text-sm text-zinc-600">
          Current notes (editable saving step next).
        </div>

        <textarea
          className="mt-4 w-full rounded-2xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
          rows={5}
          value={lead.notes ?? ""}
          readOnly
        />

        <div className="mt-2 text-xs text-zinc-500">
          Next step: notes + timeline save actions add kar ke ye area fully editable kar denge.
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-zinc-900">Timeline</div>
        <div className="mt-2 text-sm text-zinc-600">Recent activity</div>

        <div className="mt-4 space-y-3">
          {logs.length ? (
            logs.map((l) => (
              <div key={l.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-zinc-900">{safeText(l.message)}</div>
                  <div className="text-xs text-zinc-500">{formatDateTime(l.created_at)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-zinc-600">No timeline entries yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
