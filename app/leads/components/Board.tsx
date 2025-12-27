"use client";

import * as React from "react";
import {
  listAgentsAction,
  listLeadsAction,
  updateLeadStatusAction,
  assignLeadAction,
} from "../actions";
import type { Agent, Lead, LeadStatus } from "../actions";

type Stage = { id: LeadStatus; label: string };

const STAGES: Stage[] = [
  { id: "new" as LeadStatus, label: "New" },
  { id: "contacted" as LeadStatus, label: "Contacted" },
  { id: "follow_up" as LeadStatus, label: "Follow-Up" },
  { id: "booked" as LeadStatus, label: "Booked" },
  { id: "lost" as LeadStatus, label: "Lost" },
];

function safeStr(v: any) {
  return typeof v === "string" ? v : "";
}

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function buildWhatsAppLink(phoneRaw: string, msg: string) {
  const phone = phoneRaw.replace(/[^\d+]/g, "");
  const text = encodeURIComponent(msg);
  // wa.me expects digits; if you store +92 etc, it still works in many cases.
  return `https://wa.me/${phone.replace(/\+/g, "")}?text=${text}`;
}

function copyToClipboard(text: string) {
  try {
    navigator.clipboard.writeText(text);
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

type ColumnProps = {
  status: LeadStatus;
  label: string;
  leadIds: string[];
  leadsById: Record<string, Lead>;
  onView: (lead: Lead) => void;
  onAction: (lead: Lead, anchor: HTMLButtonElement) => void;
};

function Column(props: ColumnProps) {
  const { status, label, leadIds, leadsById, onView, onAction } = props;

  return (
    <div
      style={{
        width: 320,
        minWidth: 320,
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 14,
        padding: 12,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontWeight: 700 }}>{label}</div>
        <div style={{ opacity: 0.6, fontSize: 12 }}>{leadIds.length}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {leadIds.map((id) => {
          const lead = leadsById[id];
          if (!lead) return null;

          const fullName = safeStr((lead as any).full_name || (lead as any).name);
          const phone = safeStr((lead as any).phone);
          const email = safeStr((lead as any).email);
          const source = safeStr((lead as any).source);
          const priority = safeStr((lead as any).priority);

          return (
            <div
              key={id}
              style={{
                border: "1px solid #eee",
                borderRadius: 14,
                padding: 12,
                background: "#fafafa",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 999,
                    border: "1px solid #ddd",
                    background: "#fff",
                  }}
                >
                  Drag
                </div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{priority}</div>
              </div>

              <div style={{ marginTop: 8, fontWeight: 800 }}>{fullName || "—"}</div>

              <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
                {phone || ""}
                {phone && email ? <br /> : null}
                {email || ""}
              </div>

              <div style={{ marginTop: 4, fontSize: 12 }}>
                <span style={{ opacity: 0.6 }}>Source:</span> {source || "—"}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => onView(lead)}
                  style={{
                    border: "1px solid #ddd",
                    background: "#fff",
                    borderRadius: 999,
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                >
                  View
                </button>

                <button
                  type="button"
                  onClick={(e) => onAction(lead, e.currentTarget)}
                  style={{
                    border: "1px solid #111",
                    background: "#111",
                    color: "#fff",
                    borderRadius: 999,
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                >
                  Action
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Board() {
  const [loading, setLoading] = React.useState(true);

  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [agents, setAgents] = React.useState<Agent[]>([]);

  // Top filters
  const [q, setQ] = React.useState("");
  const [assignedFilter, setAssignedFilter] = React.useState<string>("all"); // all | unassigned | agent:<id>

  // View modal
  const [viewLead, setViewLead] = React.useState<Lead | null>(null);

  // Action menu
  const [actionLead, setActionLead] = React.useState<Lead | null>(null);
  const [actionAnchor, setActionAnchor] = React.useState<HTMLButtonElement | null>(null);
  const [actionPos, setActionPos] = React.useState<{ top: number; left: number } | null>(null);

  const closeActions = React.useCallback(() => {
    setActionLead(null);
    setActionAnchor(null);
    setActionPos(null);
  }, []);

  function openActions(lead: Lead, anchor: HTMLButtonElement) {
    setActionLead(lead);
    setActionAnchor(anchor);
    const r = anchor.getBoundingClientRect();
    setActionPos({ top: r.bottom + window.scrollY + 8, left: r.left + window.scrollX });
  }

  // Load data
  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [aRes, lRes] = await Promise.all([listAgentsAction(), listLeadsAction()]);
        if (!mounted) return;

        setAgents(Array.isArray(aRes) ? aRes : []);
        setLeads(Array.isArray(lRes) ? lRes : []);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Build maps
  const agentsById = React.useMemo(() => {
    const m: Record<string, Agent> = {};
    for (const a of agents) m[(a as any).id] = a;
    return m;
  }, [agents]);

  const leadsById = React.useMemo(() => {
    const m: Record<string, Lead> = {};
    for (const l of leads) m[(l as any).id] = l;
    return m;
  }, [leads]);

  // Filtered leads (search + assigned filter)
  const filteredLeads = React.useMemo(() => {
    const nq = normalize(q);
    return leads.filter((l: any) => {
      const fullName = safeStr(l.full_name || l.name);
      const phone = safeStr(l.phone);
      const email = safeStr(l.email);
      const source = safeStr(l.source);
      const route = safeStr(l.route || `${safeStr(l.departure)} ${safeStr(l.destination)}`);

      const hay = normalize([fullName, phone, email, source, route].filter(Boolean).join(" | "));

      const matchQ = nq ? hay.includes(nq) : true;

      const assignedTo = safeStr(l.assigned_to);
      let matchAssigned = true;
      if (assignedFilter === "unassigned") {
        matchAssigned = !assignedTo;
      } else if (assignedFilter.startsWith("agent:")) {
        const id = assignedFilter.replace("agent:", "");
        matchAssigned = assignedTo === id;
      }

      return matchQ && matchAssigned;
    });
  }, [leads, q, assignedFilter]);

  // Stage -> ordered ids
  const orderByStatus = React.useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const s of STAGES) m[s.id] = [];
    for (const l of filteredLeads as any[]) {
      const st = (l.status || "new") as LeadStatus;
      if (!m[st]) m[st] = [];
      m[st].push(l.id);
    }
    return m;
  }, [filteredLeads]);

  // Agent label for filter dropdown (✅ NAME show hoga)
  function agentLabel(agentId: string) {
    const a: any = agentsById[agentId];
    if (!a) return agentId; // fallback UUID
    return (safeStr(a.full_name).trim() || safeStr(a.email).trim() || safeStr(a.id)) as string;
    // NOTE: agar Agent type me email nahi hai, upar wali line TS error de sakti.
    // Isliye hum safe access "any" pe kar rahe hain. (No TS error)
  }

  // Assign lead (from Action menu)
  async function assignLead(lead: Lead, agentId: string) {
    await assignLeadAction((lead as any).id, agentId);
    // refresh leads
    const lRes = await listLeadsAction();
    setLeads(Array.isArray(lRes) ? lRes : []);
  }

  // Update status (drag/drop integration agar already hai to aapke project me ho sakta)
  async function moveLeadToStatus(leadId: string, status: LeadStatus) {
    await updateLeadStatusAction(leadId, status);
    const lRes = await listLeadsAction();
    setLeads(Array.isArray(lRes) ? lRes : []);
  }

  // Close action menu on outside click / scroll
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!actionAnchor) return;
      const t = e.target as Node;
      if (actionAnchor.contains(t)) return;
      const menu = document.getElementById("lead-action-menu");
      if (menu && menu.contains(t)) return;
      closeActions();
    }
    function onScroll() {
      if (actionAnchor) closeActions();
    }
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [actionAnchor, closeActions]);

  // ===== UI =====
  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Leads Board</div>
          <div style={{ opacity: 0.7, marginTop: 4 }}>Drag & drop to move leads across stages.</div>
          <div style={{ opacity: 0.7, marginTop: 6, fontSize: 12 }}>
            Tip: Drag only from the <b>Drag</b> handle.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a
            href="/dashboard"
            style={{
              border: "1px solid #ddd",
              padding: "8px 14px",
              borderRadius: 999,
              textDecoration: "none",
              color: "#111",
              background: "#fff",
            }}
          >
            Back to Dashboard
          </a>

          <a
            href="#add"
            style={{
              border: "1px solid #111",
              padding: "10px 16px",
              borderRadius: 999,
              textDecoration: "none",
              color: "#fff",
              background: "#111",
              fontWeight: 700,
            }}
          >
            + Add Lead
          </a>
        </div>
      </div>

      {/* Top filters */}
      <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name / phone / email / source / route..."
          style={{
            width: 520,
            maxWidth: "65vw",
            border: "1px solid #e5e5e5",
            borderRadius: 999,
            padding: "10px 14px",
            outline: "none",
          }}
        />

        <select
          value={assignedFilter}
          onChange={(e) => setAssignedFilter(e.target.value)}
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 999,
            padding: "10px 14px",
            outline: "none",
            background: "#fff",
            minWidth: 260,
          }}
        >
          <option value="all">All (Assigned + Unassigned)</option>
          <option value="unassigned">Unassigned Only</option>
          {agents.map((a: any) => (
            <option key={a.id} value={`agent:${a.id}`}>
              Assigned: {safeStr(a.full_name).trim() || safeStr(a.email).trim() || a.id}
            </option>
          ))}
        </select>

        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.65 }}>
          Showing <b>{filteredLeads.length}</b> lead(s)
        </div>
      </div>

      {/* Board */}
      <div style={{ marginTop: 18, overflowX: "auto", paddingBottom: 10 }}>
        <div style={{ display: "flex", gap: 14, minWidth: 320 * STAGES.length + 14 * (STAGES.length - 1) }}>
          {STAGES.map((s) => (
            <Column
              key={s.id}
              status={s.id}
              label={s.label}
              leadIds={orderByStatus[s.id] ?? []}
              leadsById={leadsById}
              onView={(lead) => setViewLead(lead)}
              onAction={(lead, anchor) => openActions(lead, anchor)}
            />
          ))}
        </div>
      </div>

      {/* ACTION MENU */}
      {actionLead && actionPos ? (
        <div
          id="lead-action-menu"
          style={{
            position: "absolute",
            top: actionPos.top,
            left: actionPos.left,
            width: 220,
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 12,
            boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          {(() => {
            const l: any = actionLead;
            const phone = safeStr(l.phone);
            const email = safeStr(l.email);
            const name = safeStr(l.full_name || l.name) || "Lead";
            const msg = `Hi ${name}, Times Travel CRM se follow-up:`;

            return (
              <div style={{ padding: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!phone) return;
                    window.location.href = `tel:${phone}`;
                    closeActions();
                  }}
                  style={menuBtnStyle()}
                >
                  Call
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!phone) return;
                    window.open(buildWhatsAppLink(phone, msg), "_blank");
                    closeActions();
                  }}
                  style={menuBtnStyle()}
                >
                  WhatsApp Message
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!email) return;
                    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
                      "Times Travel - Follow up"
                    )}&body=${encodeURIComponent(msg)}`;
                    closeActions();
                  }}
                  style={menuBtnStyle()}
                >
                  Email
                </button>

                <div style={{ height: 1, background: "#eee", margin: "8px 0" }} />

                <div style={{ fontSize: 12, opacity: 0.7, padding: "0 8px 6px" }}>Assign Lead</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 0 6px" }}>
                  {agents.map((a: any) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        assignLead(actionLead, a.id);
                        closeActions();
                      }}
                      style={{
                        ...menuBtnStyle(),
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{safeStr(a.full_name).trim() || safeStr(a.email).trim() || a.id}</span>
                    </button>
                  ))}
                </div>

                <div style={{ height: 1, background: "#eee", margin: "8px 0" }} />

                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(phone || "");
                    closeActions();
                  }}
                  style={menuBtnStyle()}
                >
                  Copy Phone
                </button>

                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(email || "");
                    closeActions();
                  }}
                  style={menuBtnStyle()}
                >
                  Copy Email
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewLead(actionLead);
                    closeActions();
                  }}
                  style={menuBtnStyle()}
                >
                  Open Details
                </button>
              </div>
            );
          })()}
        </div>
      ) : null}

      {/* VIEW MODAL (simple) */}
      {viewLead ? (
        <div
          onClick={() => setViewLead(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 760,
              maxWidth: "95vw",
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #eee",
              boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 900 }}>Lead Details</div>
              <button
                type="button"
                onClick={() => setViewLead(null)}
                style={{
                  border: "1px solid #ddd",
                  background: "#fff",
                  borderRadius: 999,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 14, borderTop: "1px solid #eee" }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>
                {JSON.stringify(viewLead, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div style={{ marginTop: 18, opacity: 0.7 }}>Loading…</div>
      ) : null}
    </div>
  );
}

function menuBtnStyle(): React.CSSProperties {
  return {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: "10px 10px",
    borderRadius: 10,
    cursor: "pointer",
  };
}
