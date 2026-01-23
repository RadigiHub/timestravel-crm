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

  // "sha256=...."
  const [algo, hash] = signature256.split("=");
  if (algo !== "sha256" || !hash) return false;

  const expected = crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

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

function pickFirst(obj: Record<string, string>, keys: string[]) {
  for (const k of keys) {
    const v = obj[k];
    if (v && String(v).trim()) return String(v).trim();
  }
  return "";
}

function parseDateMaybe(s: string) {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  // Supabase date column likes YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

function parseIntMaybe(s: string) {
  if (!s) return null;
  const n = parseInt(String(s).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
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
 * ✅ 1) Verification endpoint
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
  try {
    const SUPABASE_URL = getEnv("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const META_APP_SECRET = getEnv("META_APP_SECRET");
    const META_PAGE_ACCESS_TOKEN = getEnv("META_PAGE_ACCESS_TOKEN");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    rawBody = await req.text();

    // Signature header
    const signature256 = req.headers.get("x-hub-signature-256");

    // Parse body first (Meta test events are sometimes weird)
    const body = JSON.parse(rawBody);

    // Extract leadgen_id if present (for Meta test detection)
    const firstLeadgenId =
      body?.entry?.[0]?.changes?.[0]?.value?.leadgen_id ||
      body?.entry?.[0]?.changes?.[0]?.value?.leadgenId ||
      null;

    // ✅ Meta "Send to server" test usually uses 444444... fake ID
    const isMetaDashboardTest =
      typeof firstLeadgenId === "string" && firstLeadgenId.startsWith("444444");

    // ✅ If NOT a dashboard test, enforce signature
    if (!isMetaDashboardTest) {
      const ok = verifySignature(rawBody, signature256, META_APP_SECRET);
      if (!ok) return new Response("Invalid signature", { status: 401 });
    }

    // Optional: store every webhook event for debugging
    try {
      await supabase.from("meta_webhook_events").insert({
        topic: body?.object || null,
        page_id: body?.entry?.[0]?.id ? String(body.entry[0].id) : null,
        form_id: body?.entry?.[0]?.changes?.[0]?.value?.form_id
          ? String(body.entry[0].changes[0].value.form_id)
          : null,
        leadgen_id: firstLeadgenId ? String(firstLeadgenId) : null,
        payload: body,
      });
    } catch {
      // ignore if table not created
    }

    // ✅ If it's dashboard test, just ACK (no real lead to fetch)
    if (isMetaDashboardTest) {
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    // Process real lead events
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== "leadgen") continue;

        const value = change.value || {};
        const leadgenId = value.leadgen_id ? String(value.leadgen_id) : "";
        const formId = value.form_id ? String(value.form_id) : null;
        const pageId = value.page_id ? String(value.page_id) : null;

        if (!leadgenId) continue;

        // Fetch full lead details
        const lead = await fetchLeadDetails(leadgenId, META_PAGE_ACCESS_TOKEN);
        const normalized = normalizeFieldData(lead.field_data || []);

        // Basic identity fields
        const fullName = pickFirst(normalized, ["full_name", "name", "first_name", "last_name"]) || "Meta Lead";
        const email = pickFirst(normalized, ["email"]);
        const phone = pickFirst(normalized, ["phone", "phone_number", "mobile", "whatsapp", "whatsapp_number"]);

        // Map travel fields (adjust keys as per your form field names)
        const departure = pickFirst(normalized, ["departure", "from", "departure_city", "departure_city_in_the_uk", "from_city"]);
        const destination = pickFirst(normalized, ["destination", "to", "destination_city", "arrival_city", "to_city"]);
        const departDate = parseDateMaybe(pickFirst(normalized, ["depart_date", "departure_date", "travel_date", "date_of_travel"]));
        const returnDate = parseDateMaybe(pickFirst(normalized, ["return_date"]));
        const budget = pickFirst(normalized, ["budget", "what’s_your_approximate_budget_per_person?", "whats_your_approximate_budget_per_person?"]);
        const tripType = pickFirst(normalized, ["trip_type", "one_way_or_return", "return_or_oneway"]) || "return";

        // Pax
        const adults = parseIntMaybe(pickFirst(normalized, ["adults", "adult", "pax_adults"])) ?? 1;
        const children = parseIntMaybe(pickFirst(normalized, ["children", "child", "pax_children"])) ?? 0;
        const infants = parseIntMaybe(pickFirst(normalized, ["infants", "infant", "pax_infants"])) ?? 0;

        // Build payload for your existing schema
        const payload: any = {
          meta_lead_id: String(lead.id),       // ✅ dedupe key
          full_name: fullName,                  // NOT NULL
          phone: phone || null,
          email: email || null,
          source: "meta_lead_ads",

          // required FK
          status_id: "new",

          // optional mapped fields (if your leads table has these columns)
          departure: departure || null,
          destination: destination || null,
          depart_date: departDate,
          return_date: returnDate,
          budget: budget || null,

          trip_type: ["oneway", "return", "multicity"].includes(tripType) ? tripType : "return",
          adults,
          children,
          infants,

          // store everything in details
          details: {
            created_time: lead.created_time || null,
            form_id: formId || lead.form_id || null,
            page_id: pageId || null,
            ad_id: lead.ad_id || null,
            ad_name: lead.ad_name || null,
            campaign_id: lead.campaign_id || null,
            campaign_name: lead.campaign_name || null,
            platform: lead.platform || null,
            normalized_fields: normalized,
            raw_field_data: lead.field_data || null,
            raw_payload: lead || null,
          },
        };

        // keep created_at aligned (optional)
        if (lead.created_time) {
          payload.created_at = new Date(lead.created_time).toISOString();
        }

        // ✅ Upsert by meta_lead_id (requires UNIQUE index)
        const { error } = await supabase.from("leads").upsert(payload, {
          onConflict: "meta_lead_id",
        });

        if (error) throw error;
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (e: any) {
    return new Response(`Error: ${e?.message || "unknown"}`, { status: 500 });
  }
}
