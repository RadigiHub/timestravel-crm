// app/api/meta/webhook/route.ts
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // required for crypto + raw body handling

type FieldDataItem = { name: string; values: string[] };

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function verifySignature(rawBody: string, signature256: string | null, appSecret: string) {
  if (!signature256) return false;

  // Header format: "sha256=abcdef..."
  const [algo, hash] = signature256.split("=");
  if (algo !== "sha256" || !hash) return false;

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  // timingSafeEqual requires same-length buffers
  const a = Buffer.from(hash, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

function normalizeFieldData(field_data: FieldDataItem[]) {
  const out: Record<string, string> = {};
  for (const f of field_data || []) {
    out[f.name] = (f.values && f.values.length ? f.values[0] : "") ?? "";
  }
  return out;
}

async function fetchLeadDetails(leadgenId: string, accessToken: string) {
  const fields =
    "id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name,form_id,platform";

  const url = `https://graph.facebook.com/v24.0/${leadgenId}?fields=${encodeURIComponent(
    fields
  )}&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url, { method: "GET" });
  const json = await res.json();
  if (!res.ok) throw new Error(`Graph API error: ${JSON.stringify(json)}`);
  return json;
}

/**
 * ✅ 1) Verification endpoint (Meta webhook setup time)
 * GET ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 */
export async function GET(req: Request) {
  try {
    const META_VERIFY_TOKEN = getEnv("META_VERIFY_TOKEN");

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === META_VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  } catch (e: any) {
    return new Response(`Error: ${e?.message || "unknown"}`, { status: 500 });
  }
}

/**
 * ✅ 2) Webhook receiver (Meta will send leadgen events here)
 */
export async function POST(req: Request) {
  let rawBody = "";
  try {
    // ✅ Read envs at request-time (so Vercel build doesn't fail)
    const SUPABASE_URL = getEnv("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const META_APP_SECRET = getEnv("META_APP_SECRET");
    const META_PAGE_ACCESS_TOKEN = getEnv("META_PAGE_ACCESS_TOKEN");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    rawBody = await req.text();

    // ✅ Verify signature (Meta security)
    const signature256 = req.headers.get("x-hub-signature-256");
    const ok = verifySignature(rawBody, signature256, META_APP_SECRET);
    if (!ok) {
      return new Response("Invalid signature", { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // Meta lead events live in: body.entry[].changes[]
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== "leadgen") continue;

        const value = change.value || {};
        const leadgenId = value.leadgen_id;
        const formId = value.form_id;
        const pageId = value.page_id;

        if (!leadgenId) continue;

        // ✅ Fetch full lead details from Graph API
        const lead = await fetchLeadDetails(leadgenId, META_PAGE_ACCESS_TOKEN);
        const normalized = normalizeFieldData(lead.field_data || []);

        const fullName =
          normalized.full_name ||
          normalized.name ||
          normalized.first_name ||
          "Meta Lead"; // fallback (because full_name is NOT NULL in your DB)

        // ✅ Map to your existing leads schema
        // Your table has: meta_lead_id (text), full_name (not null), status_id (FK, not null), details (jsonb)
        const payload: any = {
          meta_lead_id: String(lead.id),
          full_name: fullName,
          phone: normalized.phone || null,
          email: normalized.email || null,

          source: "meta_lead_ads",

          // FK to lead_statuses(id) — you have "new"
          status_id: "new",

          // optional (your table has defaults too)
          priority: "warm",

          // Store everything else in details jsonb
          details: {
            created_time: lead.created_time || null,
            form_id: formId || lead.form_id || null,
            page_id: pageId || null,
            ad_id: lead.ad_id || null,
            ad_name: lead.ad_name || null,
            campaign_id: lead.campaign_id || null,
            campaign_name: lead.campaign_name || null,
            platform: lead.platform || null,

            raw_field_data: lead.field_data || null,
            raw_payload: lead || null,
          },
        };

        // If you want created_at to match Meta created_time:
        // (only do this if your "created_at" column exists and is writable)
        if (lead.created_time) {
          payload.created_at = new Date(lead.created_time).toISOString();
        }

        // ✅ Upsert (dedupe) by meta_lead_id
        const { error } = await supabase
          .from("leads")
          .upsert(payload, { onConflict: "meta_lead_id" });

        if (error) throw error;
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (e: any) {
    return new Response(`Error: ${e?.message || "unknown"}`, { status: 500 });
  }
}
