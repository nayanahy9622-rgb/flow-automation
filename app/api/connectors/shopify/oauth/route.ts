import {randomBytes} from "crypto";
import {NextResponse} from "next/server";
import {connectorCallback} from "@/lib/oauth";

function validShop(value: string | null): string | null {
  if (!value) return null;
  const clean = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.myshopify\.com$/, "");
  return /^[a-z0-9][a-z0-9-]*$/.test(clean) ? clean : null;
}

export async function GET(req: Request) {
  const shop = validShop(new URL(req.url).searchParams.get("shop"));
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  if (!shop) return new NextResponse("Invalid Shopify store domain", {status: 400});
  if (!clientId) return new NextResponse("Tentran AI Shopify OAuth is not configured. Add SHOPIFY_CLIENT_ID on the server.", {status: 503});

  const state = randomBytes(32).toString("base64url");
  const callback = connectorCallback("shopify");
  const scopes = "read_products,read_orders,read_customers,read_inventory,write_products";
  const authorize = new URL(`https://${shop}.myshopify.com/admin/oauth/authorize`);
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("scope", scopes);
  authorize.searchParams.set("redirect_uri", callback);
  authorize.searchParams.set("state", state);

  const response = NextResponse.redirect(authorize);
  response.cookies.set("flowos_shopify_oauth_state", state, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600,
  });
  response.cookies.set("flowos_shopify_oauth_shop", shop, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600,
  });
  return response;
}
