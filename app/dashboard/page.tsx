import Link from "next/link";
import LogoutButton from "./logout-button";

export default function DashboardPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Dashboard</h1>
          <p style={{ margin: "6px 0 0", color: "#555" }}>
            Times Travel CRM — quick access & daily overview
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/leads">
            <button
              style={{
                padding: "10px 14px",
                border: "1px solid #000",
                borderRadius: 10,
                background: "#000",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Open Leads Board
            </button>
          </Link>

          <LogoutButton />
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <Card
          title="Leads Board"
          desc="Manage leads stages, drag & drop, quick follow-ups."
          cta="Go to Leads"
          href="/leads"
        />

        <Card
          title="Login / Users"
          desc="Switch user / re-login if session issues happen."
          cta="Open Login"
          href="/login"
        />

        <Card
          title="Today’s Workflow"
          desc="Check New → Contacted → Follow-Up → Booked flow."
          cta="View Leads"
          href="/leads"
        />

        <Card
          title="Coming Next"
          desc="KPI cards, agent performance, filters, notes, reminders."
          cta="Open Leads"
          href="/leads"
        />
      </div>

      {/* Status Section */}
      <div
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 14,
          padding: 16,
          background: "#fafafa",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>System Status</div>

        <ul style={{ margin: 0, paddingLeft: 18, color: "#333", lineHeight: 1.8 }}>
          <li>✅ Login working</li>
          <li>✅ Leads board working</li>
          <li>➡️ Next: Make dashboard show counts (New/Contacted/Follow-Up/Booked)</li>
          <li>➡️ Next: Add “Add Lead” modal + validation + duplicate checks</li>
        </ul>
      </div>
    </div>
  );
}

function Card({
  title,
  desc,
  cta,
  href,
}: {
  title: string;
  desc: string;
  cta: string;
  href: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 14,
        padding: 16,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#555", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        {desc}
      </div>

      <Link href={href}>
        <button
          style={{
            padding: "9px 12px",
            border: "1px solid #000",
            borderRadius: 10,
            background: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {cta}
        </button>
      </Link>
    </div>
  );
}
