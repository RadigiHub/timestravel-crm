import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ---- Env (with fallbacks) ----
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const META_VERIFY_TOKEN =
  process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN || "";

const META_APP_SECRET = process.env.META_APP_SECRET || ""; // optional but recommended
const META_PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || "";

const LEADS_DEFAULT_STATUS_ID = process.env.LEADS_DEFAULT_STATUS_ID || "";

// Basic hard checks (so build/runtime errors are clear)
function assertEnv() {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL is required.");
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
  if (!META_VERIFY_TOKEN) throw new Error("META_WEBHOOK_VERIFY_TOKEN (or META_VERIFY_TOKEN) is required.");
  if (!META_PAGE_ACCESS_TOKEN) throw new Error("META_PAGE_ACCESS_TOKEN is required.");
  if (!LEADS_DEFAULT_STATUS_ID) throw new Error("LEADS_DEFAULT_STATUS_ID is required (status_id is NOT NULL).");
}
assertEnv();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---- Helpers ----
function verifySignature(rawBody: string, signature256: string | null) {
  // If app secret not set, we skip verification (not ideal, but prevents blocking)
  // Recommended: set META_APP_SECRET in Vercel for production.
  if (!META_APP_SECRET) return true;

  if (!signature256) return false;
  const [algo, hash] = signature256.split("=");
  if (algo !== "sha256" || !hash) return false;

  const expected = crypto
    .createHmac("sha256", META_APP_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  // Prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function fetchLeadDetails(leadgenId: string) {
  const fields =
    "id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name,form_id,platform";
  const url = `https://graph.facebook.com/v24.0/${leadgenId}?fields=${encodeURIComponent(
    fields
  )}&access_token=${encodeURIComponent(META_PAGE_ACCESS_TOKEN)}`;

  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(`Meta API error: ${JSON.stringify(json)}`);
  return json;
}

function normalizeFieldData(field_data: Array<{ name: string; values: string[] }>) {
  const out: Record<string, string> = {};
  for (const f of field_data || []) {
    out[f.name] = (f.values && f.values.length ? f.values[0] : "") ?? "";
  }
  return out;
}

function pickFirst(normalized: Record<string, string>, keys: string[]) {
  for (const k of keys) {
    if (normalized[k]) return normalized[k];
  }
  return "";
}

// ✅ 1) Verification endpoint (Meta webhook setup time)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === META_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// ✅ 2) Webhook receiver
export async function POST(req: Request) {
  const rawBody = await req.text();

  // Signature verify
  const signature256 = req.headers.get("x-hub-signature-256");
  const ok = verifySignature(rawBody, signature256);

  if (!ok) return new Response("Invalid signature", { status: 401 });

  const body = JSON.parse(rawBody);

  try {
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== "leadgen") continue;

        const value = change.value || {};
        const leadgenId = value.leadgen_id as string | undefined;
        const formId = (value.form_id as string | undefined) || null;
        const pageId = (value.page_id as string | undefined) || null;

        if (!leadgenId) continue;

        // Pull lead details from Meta
        const lead = await fetchLeadDetails(leadgenId);
        const normalized = normalizeFieldData(lead.field_data || []);

        // Map common fields (forms can vary)
        const fullName =
          pickFirst(normalized, ["full_name", "name", "fullname"]) ||
          pickFirst(normalized, ["first_name"]) ||
          "Meta Lead";

        const phone = pickFirst(normalized, ["phone", "phone_number", "mobile"]);
        const email = pickFirst(normalized, ["email"]);

        // Optional travel fields if your form has them
        const departure = pickFirst(normalized, ["departure", "departure_city", "departure_city_in_the_uk"]);
        const destination = pickFirst(normalized, ["destination", "arrival_city", "to"]);
        const budget = pickFirst(normalized, ["budget", "what’s_your_approximate_budget_per_person?", "whats_your_approximate_budget_per_person?"]);
        const tripType = pickFirst(normalized, ["trip_type", "trip", "journey_type"]) || "return";

        // Put everything in details jsonb (best for flexible forms)
        const details = {
          meta: {
            leadgen_id: lead.id,
            created_time: lead.created_time,
            form_id: formId || lead.form_id || null,
            page_id: pageId,
            ad_id: lead.ad_id || null,
            ad_name: lead.ad_name || null,
            campaign_id: lead.campaign_id || null,
            campaign_name: lead.campaign_name || null,
            platform: lead.platform || null,
          },
          field_data: lead.field_data || [],
          normalized,
        };

        // ✅ Upsert into your existing public.leads schema
        // Requires: meta_lead_id column + unique index (step 1)
        const payload = {
          meta_lead_id: lead.id,            // <-- new column for dedupe
          full_name: fullName,              // NOT NULL
          phone: phone || null,
          email: email || null,
          source: "meta_lead_ads",
          status_id: LEADS_DEFAULT_STATUS_ID,  // NOT NULL FK
          trip_type: tripType,              // your enum expects oneway/return/multicity
          departure: departure || null,
          destination: destination || null,
          budget: budget || null,
          details,                          // jsonb
        };

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
