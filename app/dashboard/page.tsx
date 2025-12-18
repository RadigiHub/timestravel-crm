import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

type StatusRow = {
  id: string;
  name: string;
};

async function countByStatus(statusId: string) {
  const supabase = await supabaseServer();
  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status_id", statusId);

  if (error) return 0;
  return count ?? 0;
}

export default async function DashboardPage() {
  const supabase = await supabaseServer();

  // ✅ Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ✅ Load statuses (New/Contacted/Follow-Up/Booked etc.)
  const { data: statusesData, error: statusesError } = await supabase
    .from("lead_statuses")
    .select("id,name")
    .order("name", { ascending: true });

  const statuses: StatusRow[] = statusesError ? [] : (statusesData ?? []);

  // ✅ Count leads per status (small number of statuses so OK)
  const counts: Record<string, number> = {};
  for (const s of statuses) {
    counts[s.id] = await countByStatus(s.id);
  }

  // ✅ total leads
  const totalLeads = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 40, margin: 0, lineHeight: 1.1 }}>
            Dashboard
          </h1>
          <p style={{ marginTop: 8, color: "#444" }}>
            Times Travel CRM — quick access & daily overview
          </p>
          <p style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
            Logged in as <b>{user.email}</b>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            href="/leads"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Open Leads Board
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* KPI row */}
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 14,
            padding: 14,
            background: "#fff",
          }}
        >
          <div style={{ color: "#666", fontSize: 12 }}>Total Leads</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
            {totalLeads}
          </div>
          <div style={{ marginTop: 10 }}>
            <Link href="/leads" style={{ textDecoration: "underline" }}>
              View board →
            </Link>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 14,
            padding: 14,
            background: "#fff",
          }}
        >
          <div style={{ color: "#666", fontSize: 12 }}>Quick Actions</div>
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/leads" style={{ textDecoration: "underline" }}>
              Add / Move Leads
            </Link>
            <span style={{ color: "#bbb" }}>•</span>
            <Link href="/login" style={{ textDecoration: "underline" }}>
              Switch User
            </Link>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 14,
            padding: 14,
            background: "#fff",
          }}
        >
          <div style={{ color: "#666", fontSize: 12 }}>Today’s Workflow</div>
          <div style={{ marginTop: 8, color: "#333", fontSize: 14 }}>
            New → Contacted → Follow-Up → Booked
          </div>
          <div style={{ marginTop: 10 }}>
            <Link href="/leads" style={{ textDecoration: "underline" }}>
              Start follow-ups →
            </Link>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 14,
            padding: 14,
            background: "#fff",
          }}
        >
          <div style={{ color: "#666", fontSize: 12 }}>System</div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#333" }}>
            ✅ Login OK <br />
            ✅ Leads board OK
          </div>
        </div>
      </div>

      {/* Status counts */}
      <div
        style={{
          marginTop: 14,
          border: "1px solid #eaeaea",
          borderRadius: 16,
          padding: 16,
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Lead Status Summary</h2>
          <Link href="/leads" style={{ textDecoration: "underline" }}>
            Open board →
          </Link>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          {statuses.length === 0 ? (
            <div style={{ color: "#666" }}>
              No statuses found. Ensure <b>lead_statuses</b> table has rows.
            </div>
          ) : (
            statuses.map((s) => (
              <div
                key={s.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 14,
                  padding: 12,
                  background: "#fafafa",
                }}
              >
                <div style={{ fontSize: 12, color: "#666" }}>{s.name}</div>
                <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800 }}>
                  {counts[s.id] ?? 0}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 14, fontSize: 13, color: "#666" }}>
          Next: Add “Add Lead” modal + validation + duplicate checks (phone/email).
        </div>
      </div>
    </div>
  );
}
