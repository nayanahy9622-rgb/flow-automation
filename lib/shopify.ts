import {ConnectorAuth} from "./connectorStore";

export const SHOPIFY_SCOPES = "read_products,read_orders,read_customers,read_inventory,write_products";
export const SHOPIFY_API_VERSION = "2026-07";

export function normalizeShop(value: string): string | null {
  const clean = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.myshopify\.com$/, "");
  return /^[a-z0-9][a-z0-9-]*$/.test(clean) ? clean : null;
}

export function shopDomain(shop: string): string {
  return `${shop}.myshopify.com`;
}

function headers(token: string): HeadersInit {
  return {"content-type":"application/json", "X-Shopify-Access-Token": token, accept:"application/json"};
}

export async function shopifyGraphql(shop: string, token: string, query: string, variables?: Record<string, unknown>) {
  const res = await fetch(`https://${shopDomain(shop)}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method:"POST", headers:headers(token), cache:"no-store", body:JSON.stringify({query, variables}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Shopify API ${res.status}`);
  if (json.errors?.length) throw new Error(json.errors.map((e: {message?:string}) => e.message || "GraphQL error").join("; "));
  return json.data;
}

export async function validateShopifyToken(shop: string, token: string) {
  return shopifyGraphql(shop, token, "query { shop { id name email myshopifyDomain } }");
}

export async function exchangeShopifyCode(shop: string, code: string, redirectUri: string) {
  const res = await fetch(`https://${shopDomain(shop)}/admin/oauth/access_token`, {
    method:"POST", headers:{"content-type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({client_id:process.env.SHOPIFY_CLIENT_ID || "",client_secret:process.env.SHOPIFY_CLIENT_SECRET || "",code,redirect_uri:redirectUri,expiring:"1"}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error("Shopify token exchange failed");
  return json;
}

export async function refreshShopifyAuth(shop: string, auth: ConnectorAuth): Promise<ConnectorAuth> {
  if (!auth.refreshToken) return auth;
  const res = await fetch(`https://${shopDomain(shop)}/admin/oauth/access_token`, {
    method:"POST", headers:{"content-type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({client_id:process.env.SHOPIFY_CLIENT_ID || "",client_secret:process.env.SHOPIFY_CLIENT_SECRET || "",grant_type:"refresh_token",refresh_token:auth.refreshToken}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error("Shopify token refresh failed");
  return {
    ...auth,
    accessToken:String(json.access_token),
    refreshToken:json.refresh_token ? String(json.refresh_token) : auth.refreshToken,
    expiresAt:json.expires_in ? Date.now() + Number(json.expires_in) * 1000 : auth.expiresAt,
  };
}
