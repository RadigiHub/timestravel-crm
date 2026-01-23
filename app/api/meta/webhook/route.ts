// app/api/meta/webhook/route.ts
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type FieldDataItem = { name: string; values: string[] };

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function verifySignature(rawBody: string, signature256: string | null, appSecret: string) {
  if (!signature256) return false;

  const [algo, hash] = signature256.split("=");
  if (algo !== "sha256" || !hash) return false;

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

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
 * ✅ 2) Webhook receiver
 */
export async function POST(req: Request) {
  let rawBody = "";

  // ✅ Read env at request time
  const SUPABASE_URL = getEnv("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const META_APP_SECRET = getEnv("META_APP_SECRET");
  const META_PAGE_ACCESS_TOKEN = getEnv("META_PAGE_ACCESS_TOKEN");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    rawBody = await req.text();

    // ✅ Verify signature
    const signature256 = req.headers.get("x-hub-signature-256");
    const ok = verifySignature(rawBody, signature256, META_APP_SECRET);
    if (!ok) {
      // For security: reject if signature invalid
      return new Response("Invalid signature", { status: 401 });
    }

    const body = JSON.parse(rawBody);

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== "leadgen") continue;

        const value = change.value || {};
        const leadgenId = value.leadgen_id ? String(value.leadgen_id) : null;
        const formId = value.form_id ? String(value.form_id) : null;
        const pageId = value.page_id ? String(value.page_id) : null;

        // ✅ Always log webhook event (debug)
        const logInsert = await supabase.from("meta_webhook_events").insert({
          topic: "leadgen",
          page_id: pageId,
          form_id: formId,
          leadgen_id: leadgenId,
          payload: body,
          error: null,
        });

        if (logInsert.error) {
          // logging fail ho bhi jaye, lead processing continue
          // (but usually service role me ye bhi ok hota)
        }

        if (!leadgenId) continue;

        // ✅ Fetch full lead details
        const lead = await fetchLeadDetails(leadgenId, META_PAGE_ACCESS_TOKEN);
        const normalized = normalizeFieldData(lead.field_data || []);

        const fullName =
          normalized.full_name ||
          normalized.name ||
          normalized.first_name ||
          "Meta Lead";

        // ✅ Map to your schema
        const payload: any = {
          meta_lead_id: String(lead.id),
          full_name: fullName,
          phone: normalized.phone || null,
          email: normalized.email || null,
          source: "meta_lead_ads",
          status_id: "new", // aapke lead_statuses me "new" exists

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

        if (lead.created_time) {
          payload.created_at = new Date(lead.created_time).toISOString();
        }

        // ✅ Upsert by meta_lead_id (needs unique index)
        const { error } = await supabase
          .from("leads")
          .upsert(payload, { onConflict: "meta_lead_id" });

        if (error) {
          // update last webhook log with error (optional)
          await supabase
            .from("meta_webhook_events")
            .insert({
              topic: "leadgen_error",
              page_id: pageId,
              form_id: formId,
              leadgen_id: leadgenId,
              payload: { lead, normalized },
              error: String(error.message || error),
            });

          throw error;
        }
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (e: any) {
    // Try to log error too
    try {
      await supabase.from("meta_webhook_events").insert({
        topic: "webhook_handler_error",
        payload: rawBody ? { rawBody } : {},
        error: String(e?.message || e),
      });
    } catch {}

    return new Response(`Error: ${e?.message || "unknown"}`, { status: 500 });
  }
}
