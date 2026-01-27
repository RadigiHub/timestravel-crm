// app/api/leads/web/route.ts
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

// Simple anti-spam (optional)
function isValidEmail(email?: string | null) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = getEnv("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();

    // Accept both Elementor + custom forms
    const full_name = (body.full_name || body.name || "Web Lead").toString();
    const phone = body.phone ? String(body.phone) : null;
    const email = body.email ? String(body.email) : null;

    // Optional: ignore empty spam submissions
    if (!phone && !isValidEmail(email)) {
      return new Response("Missing phone/email", { status: 400 });
    }

    const payload: any = {
      full_name,
      phone,
      email,
      source: "web",
      status_id: "new",
      details: {
        raw_payload: body,
        user_agent: req.headers.get("user-agent"),
      },
    };

    const { error } = await supabase.from("leads").insert(payload);
    if (error) return new Response(`DB error: ${error.message}`, { status: 500 });

    return new Response("OK", { status: 200 });
  } catch (e: any) {
    return new Response(`Error: ${e?.message || "unknown"}`, { status: 500 });
  }
}
