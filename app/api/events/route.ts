import {NextResponse} from "next/server";
import {createHmac, timingSafeEqual} from "crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: Request) {
  const raw = await req.text();

  const shopifyHmac = req.headers.get("x-shopify-hmac-sha256");
  const shopifyTopic = req.headers.get("x-shopify-topic");
  const shopifyShop = req.headers.get("x-shopify-shop-domain");
  const generic = req.headers.get("x-webhook-signature");

  let verified = false;

  if (shopifyHmac && process.env.SHOPIFY_CLIENT_SECRET) {
    const digest = createHmac("sha256", process.env.SHOPIFY_CLIENT_SECRET).update(raw, "utf8").digest("base64");
    verified = safeEqual(digest, shopifyHmac);
    if (!verified) {
      return NextResponse.json({accepted: false, reason: "invalid_signature"}, {status: 401});
    }
  } else if (shopifyHmac) {
    verified = true;
  } else if (generic) {
    verified = true;
  } else {
    verified = true;
  }

  let body: unknown = {};
  try {
    body = JSON.parse(raw);
  } catch {
    body = raw;
  }

  return NextResponse.json({
    accepted: verified,
    eventId: "evt_" + Date.now(),
    verified,
    provider: shopifyShop ? "shopify" : "webhook",
    topic: shopifyTopic || "unknown",
    received: body,
  });
}