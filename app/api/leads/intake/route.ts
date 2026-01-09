import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type IntakePayload = Record<string, any>;

function pickFirst(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function normalizePhone(p: string | null) {
  if (!p) return null;
  const digits = p.replace(/[^\d+]/g, "");
  return digits || null;
}

function safeText(v: any) {
  if (v == null) return null;
  if (typeof v === "string") return v.trim();
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export async function POST(req: Request) {
  try {
    // ---- Security check ----
    const secret = process.env.CRM_INTAKE_SECRET;
    const headerSecret = req.headers.get("x-crm-secret");

    if (!secret) {
      return NextResponse.json({ ok: false, error: "Server not configured: CRM_INTAKE_SECRET missing" }, { status: 500 });
    }
    if (!headerSecret || headerSecret !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // ---- Parse payload ----
    const body = (await req.json().catch(() => ({}))) as IntakePayload;

    // Elementor webhook payload varies; we support common shapes:
    // body, body.fields, body.data, body.form_fields etc.
    const raw = body?.fields || body?.data || body?.form_fields || body;

    const full_name =
      pickFirst(raw, ["full_name", "name", "fullName", "fullname", "your-name", "field_name", "Field Name"]) ?? "Website Lead";
    const email = pickFirst(raw, ["email", "your-email", "Email", "field_email", "Field Email"]);
    const phone = normalizePhone(pickFirst(raw, ["phone", "mobile", "tel", "your-phone", "Phone", "field_phone", "Field Phone"]));

    // Notes/message
    const notes =
      pickFirst(raw, ["notes", "message", "details", "your-message", "comment", "requirements"]) ??
      safeText(raw);

    // ---- Supabase (Service Role) ----
    // IMPORTANT: set these in Vercel env (they usually already exist in your project):
    // SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Server not configured: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ---- Insert Lead ----
    const leadInsert = {
      full_name,
      email,
      phone,
      notes,
      source: "Website",
      status: "New",
      // You can add more fields later if your leads table has them:
      // brand_id, assigned_to, etc
    };

    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .insert(leadInsert)
      .select("id")
      .single();

    if (leadErr || !lead?.id) {
      return NextResponse.json({ ok: false, error: leadErr?.message || "Lead insert failed" }, { status: 400 });
    }

    // ---- Log Activity ----
    const { error: actErr } = await supabase.from("lead_activities").insert({
      lead_id: lead.id,
      type: "form_submit",
      message: "Elementor website form submission",
      created_by: null,
    });

    if (actErr) {
      // lead created, activity failed — still ok
      return NextResponse.json({ ok: true, lead_id: lead.id, warning: actErr.message });
    }

    return NextResponse.json({ ok: true, lead_id: lead.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
