import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN!;
const META_APP_SECRET = process.env.META_APP_SECRET!;
const META_PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN!;

if (!SUPABASE_URL) throw new Error("SUPABASE_URL is required");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
if (!META_VERIFY_TOKEN) throw new Error("META_VERIFY_TOKEN is required");
if (!META_APP_SECRET) throw new Error("META_APP_SECRET is required");
if (!META_PAGE_ACCESS_TOKEN) throw new Error("META_PAGE_ACCESS_TOKEN is required");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function verifySignature(rawBody: string, signature256: string | null) {
  if (!signature256) return false;
  const [algo, hash] = signature256.split("=");
  if (algo !== "sha256" || !hash) return false;

  const expected = crypto
    .createHmac("sha256", META_APP_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
}

async function fetchLeadDetails(leadgenId: string) {
  const fields = "id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name,form_id,platform";
  const url = `https://graph.facebook.com/v24.0/${leadgenId}?fields=${encodeURIComponent(
    fields
  )}&access_token=${encodeURIComponent(META_PAGE_ACCESS_TOKEN)}`;

  const res = await fetch(url, { method: "GET" });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

function normalizeFieldData(field_data: Array<{ name: string; values: string[] }>) {
  const out: Record<string, string> = {};
  for (const f of field_data || []) {
    out[f.name] = (f.values && f.values.length ? f.values[0] : "") ?? "";
  }
  return out;
}

// ✅ Meta Verification (GET)
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

// ✅ Webhook receiver (POST)
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature256 = req.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature256)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(rawBody);

  try {
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== "leadgen") continue;

        const value = change.value || {};
        const leadgenId = value.leadgen_id;
        const formId = value.form_id || null;
        const pageId = value.page_id || null;

        if (!leadgenId) continue;

        // 1) Pull full lead details
        const lead = await fetchLeadDetails(leadgenId);
        const normalized = normalizeFieldData(lead.field_data || []);

        // 2) Map into your CRM schema
        const fullName =
          normalized.full_name ||
          normalized.fullname ||
          normalized.name ||
          "Unknown";

        const payload = {
          full_name: fullName,
          phone: normalized.phone || normalized.mobile_number || null,
          email: normalized.email || null,

          source: "meta_lead_ads",
          status_id: "new", // ✅ lead_statuses.id = "new"
          priority: "warm",

          // keep everything inside details (jsonb)
          details: {
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
              field_data: lead.field_data || null,
            },
          },

          // ✅ if you added meta_lead_id column (recommended)
          meta_lead_id: lead.id,
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
