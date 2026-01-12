import { NextRequest, NextResponse } from "next/server";

/**
 * META WEBHOOK VERIFICATION (GET)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.META_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge ?? "", {
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
 * META LEAD EVENTS (POST)
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  console.log("META WEBHOOK EVENT:", JSON.stringify(body, null, 2));

  return NextResponse.json({ ok: true });
}
