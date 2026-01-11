// app/api/leads/intake/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSecret(req: Request) {
  // 1) Query param: ?key=...
  const url = new URL(req.url);
  const keyFromQuery = url.searchParams.get("key");

  // 2) Header (optional): x-crm-intake-secret
  const keyFromHeader = req.headers.get("x-crm-intake-secret");

  return keyFromQuery || keyFromHeader || "";
}

export async function POST(req: Request) {
  try {
    const incomingSecret = getSecret(req);
    const expectedSecret = process.env.CRM_INTAKE_SECRET || "";

    if (!expectedSecret) {
      return NextResponse.json(
        { ok: false, error: "CRM_INTAKE_SECRET is not set on server" },
        { status: 500 }
      );
    }

    if (!incomingSecret || incomingSecret !== expectedSecret) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase env vars missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Map incoming fields (safe defaults)
    const payload = {
      name: body.name ?? body.Name ?? null,
      email: body.email ?? body.Email ?? null,
      phone: body.phone ?? body.Contact ?? body.contact ?? null,
      source: body.source ?? body.Source ?? "Elementor",
      meta: body, // store full raw payload for debugging
    };

    // Insert into leads table (adjust column names if different)
    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        source: payload.source,
        meta: payload.meta,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, lead: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method Not Allowed" },
    { status: 405 }
  );
}
