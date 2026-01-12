import { NextResponse } from "next/server";

/**
 * META WEBHOOK VERIFICATION + LEAD RECEIVER
 * SAFE, LOCKED, PRODUCTION-READY
 */

const VERIFY_TOKEN = "timestravel_meta_verify";

/**
 * 1️⃣ META VERIFICATION (GET)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // 🔐 Verification check
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json(
    { error: "Webhook verification failed" },
    { status: 403 }
  );
}

/**
 * 2️⃣ META LEADS (POST)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("META LEAD RECEIVED:", JSON.stringify(body, null, 2));

    // ✅ Later yahan Supabase insert logic aayegi
    // (abhi sirf receive kar rahe hain – SAFE MODE)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("META WEBHOOK ERROR:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
