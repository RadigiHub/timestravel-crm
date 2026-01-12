// app/api/leads/intake/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // IMPORTANT: stable env + node runtime

function json(res: any, status = 200) {
  return NextResponse.json(res, { status });
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key") || "";

    const expected = (process.env.CRM_INTAKE_SECRET || "").trim();

    // Debug (safe): secret show nahi hoga
    console.log("[intake] key_present:", Boolean(key));
    console.log("[intake] expected_present:", Boolean(expected));
    console.log("[intake] key_length:", key.length);
    console.log("[intake] expected_length:", expected.length);

    if (!expected) {
      return json(
        { ok: false, error: "Server misconfigured: CRM_INTAKE_SECRET missing" },
        500
      );
    }

    if (key.trim() !== expected) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    // Parse JSON body (Elementor webhook sends JSON when Advanced Data ON)
    let payload: any = null;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      // fallback: form-encoded (some webhooks do this)
      const text = await req.text();
      payload = { raw: text };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !serviceRole) {
      return json(
        { ok: false, error: "Server misconfigured: Supabase env missing" },
        500
      );
    }

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });

    const userAgent = req.headers.get("user-agent");
    // IP header names vary on Vercel
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      null;

    // Store raw event safely
    const { error } = await supabase.from("intake_events").insert({
      source: payload?.source || "unknown",
      payload,
      user_agent: userAgent,
      ip: typeof ip === "string" ? ip.split(",")[0].trim() : null,
    });

    if (error) {
      console.error("[intake] supabase insert error:", error);
      return json({ ok: false, error: "Database insert failed" }, 500);
    }

    return json({ ok: true });
  } catch (e: any) {
    console.error("[intake] fatal:", e?.message || e);
    return json({ ok: false, error: "Server error" }, 500);
  }
}

// Optional: health check (GET) so browser me test ho sake
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";
  const expected = (process.env.CRM_INTAKE_SECRET || "").trim();

  if (!expected) return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  if (key.trim() !== expected) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ ok: true, message: "Intake endpoint alive" });
}
