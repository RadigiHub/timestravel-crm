// app/api/meta/webhook/route.ts
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// --- Meta Webhook Verification (GET) ---
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.META_VERIFY_TOKEN;

  // Meta expects: if mode=subscribe and verify_token matches => return hub.challenge as plain text (200)
  if (mode === "subscribe" && token && expectedToken && token === expectedToken) {
    return new Response(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Webhook verification failed", { status: 403 });
}

// --- Helpers: optional signature check (recommended) ---
function verifyMetaSignature(rawBody: string, signature256: string | null) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return true; // if you haven't set secret yet, skip verification

  if (!signature256?.startsWith("sha256=")) return false;
  const sig = signature256.replace("sha256=", "");

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  // timing-safe compare
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

async function fetchLeadDetails(leadId: string) {
  const token = process.env.META_ACCESS_TOKEN; // Page access token OR System User token with lead permissions
  if (!token) return null;

  // You can change version if needed
  const url = `https://graph.facebook.com/v20.0/${leadId}?fields=created_time,field_data&access_token=${encodeURIComponent(
    token
  )}`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) return { error: `Graph error ${res.status}`, body: await res.text() };
  return await res.json();
}

// --- Webhook Events Receiver (POST) ---
export async function POST(req: Request) {
  const rawBody = await req.text();

  // Verify signature (Meta sends: x-hub-signature-256)
  const sig256 = req.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, sig256)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Try to extract lead ids from page leadgen webhook payload
  const leadIds: string[] = [];
  if (body?.object === "page" && Array.isArray(body?.entry)) {
    for (const entry of body.entry) {
      const changes = entry?.changes;
      if (!Array.isArray(changes)) continue;

      for (const ch of changes) {
        const field = ch?.field;
        const value = ch?.value;

        // Most common for Lead Ads is: field="leadgen" and value.leadgen_id OR value.lead_id
        if (field === "leadgen" && value) {
          if (value.leadgen_id) leadIds.push(String(value.leadgen_id));
          if (value.lead_id) leadIds.push(String(value.lead_id));
        }
      }
    }
  }

  // Fetch details for each lead id (if token exists)
  const details: any[] = [];
  for (const id of leadIds) {
    const d = await fetchLeadDetails(id);
    details.push({ lead_id: id, details: d });
  }

  // Save into intake_events so we can debug + later map into leads table
  if (supabase) {
    await supabase.from("intake_events").insert({
      source: "Meta Webhook",
      payload: {
        raw: body,
        extracted_lead_ids: leadIds,
        fetched: details,
      },
      received_at: new Date().toISOString(),
      user_agent: req.headers.get("user-agent") ?? "",
      ip: req.headers.get("x-forwarded-for") ?? "",
    });
  }

  // Meta expects 200 quickly
  return new Response("OK", { status: 200 });
}
