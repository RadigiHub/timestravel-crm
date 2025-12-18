import Link from "next/link";
import LogoutButton from "./logout-button";
import { supabaseServer } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  const email = data?.user?.email ?? null;

  return (
    <main style={{ padding: 24 }}>
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800 }}>
              Dashboard
            </h1>
            <p style={{ margin: "6px 0 0", opacity: 0.75 }}>
              Times Travel CRM — quick access &amp; daily overview
            </p>

            {/* Logged in as */}
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 12,
                background: "rgba(0,0,0,0.02)",
                display: "inline-block",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>Logged in as</div>
              <div style={{ fontWeight: 700 }}>
                {email ? email : "—"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              href="/leads"
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.15)",
                background: "#000",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Open Leads Board
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginTop: 14,
          }}
        >
          <div
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 14,
              padding: 16,
              background: "#fff",
            }}
          >
            <h3 style={{ margin: 0, fontWeight: 800 }}>Leads Board</h3>
            <p style={{ margin: "6px 0 14px", opacity: 0.75, fontSize: 13 }}>
              Manage leads stages, drag &amp; drop, quick follow-ups.
            </p>
            <Link
              href="/leads"
              style={{
                display: "inline-block",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.18)",
                textDecoration: "none",
                fontWeight: 700,
                color: "#000",
                background: "#fff",
              }}
            >
              Go to Leads
            </Link>
          </div>

          <div
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 14,
              padding: 16,
              background: "#fff",
            }}
          >
            <h3 style={{ margin: 0, fontWeight: 800 }}>Login / Users</h3>
            <p style={{ margin: "6px 0 14px", opacity: 0.75, fontSize: 13 }}>
              Switch user / re-login if session issues happen.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.18)",
                textDecoration: "none",
                fontWeight: 700,
                color: "#000",
                background: "#fff",
              }}
            >
              Open Login
            </Link>
          </div>

          <div
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 14,
              padding: 16,
              background: "#fff",
            }}
          >
            <h3 style={{ margin: 0, fontWeight: 800 }}>Today’s Workflow</h3>
            <p style={{ margin: "6px 0 14px", opacity: 0.75, fontSize: 13 }}>
              Check New → Contacted → Follow-Up → Booked flow.
            </p>
            <Link
              href="/leads"
              style={{
                display: "inline-block",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.18)",
                textDecoration: "none",
                fontWeight: 700,
                color: "#000",
                background: "#fff",
              }}
            >
              View Leads
            </Link>
          </div>

          <div
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 14,
              padding: 16,
              background: "#fff",
            }}
          >
            <h3 style={{ margin: 0, fontWeight: 800 }}>Coming Next</h3>
            <p style={{ margin: "6px 0 14px", opacity: 0.75, fontSize: 13 }}>
              KPI cards, agent performance, filters, notes, reminders.
            </p>
            <Link
              href="/leads"
              style={{
                display: "inline-block",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.18)",
                textDecoration: "none",
                fontWeight: 700,
                color: "#000",
                background: "#fff",
              }}
            >
              Open Leads
            </Link>
          </div>
        </div>

        {/* Status box */}
        <div
          style={{
            marginTop: 16,
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 14,
            padding: 16,
            background: "#fff",
          }}
        >
          <h3 style={{ margin: 0, fontWeight: 800 }}>System Status</h3>

          <div style={{ marginTop: 10, lineHeight: 1.7 }}>
            <div>✅ Login working</div>
            <div>✅ Leads board working</div>
            <div>➡️ Next: dashboard counts (New/Contacted/Follow-Up/Booked)</div>
            <div>➡️ Next: Add Lead modal + validation + duplicate checks</div>
          </div>
        </div>
      </div>
    </main>
  );
}
