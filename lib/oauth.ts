import {randomBytes} from "crypto";
import {setConnector} from "./connectorStore";

export type Provider = {
  id: string;
  name: string;
  mode: "oauth" | "api-key" | "manual";
  clientId?: string;
  clientSecret?: string;
  apiKeys?: (string | undefined)[];
  scopes?: string;
  authorize?: (clientId: string, redirectUri: string, state: string) => string;
  exchange?: (clientId: string, clientSecret: string, code: string, redirectUri: string) => Promise<string>;
  summary?: (accessToken: string) => Promise<string>;
  manualNote?: string;
};

const appUrl = () => process.env.APP_URL || "http://localhost:3000";
export const connectorCallback = (id: string) => `${appUrl()}/api/connectors/${id}/callback`;

async function oauthToken(url: string, form: Record<string, string>): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {"content-type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams(form),
  });
  const json = await res.json().catch(() => ({}));
  const token = json.access_token || json.accessToken;
  if (!token) throw new Error(`Token exchange failed for ${url}: ${JSON.stringify(json)}`);
  return token as string;
}

const shopify = {
  clientId: process.env.SHOPIFY_CLIENT_ID,
  clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
  scopes: "read_products,read_orders,read_customers,read_inventory,write_products",
  authorize: (clientId: string, redirectUri: string, state: string) =>
    `https://${process.env.SHOPIFY_SHOP}/admin/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(
      "read_products,read_orders,read_customers,read_inventory,write_products"
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&grant_options[]=per-user`,
  exchange: async (clientId: string, clientSecret: string, code: string, redirectUri: string) =>
    oauthToken(`https://${process.env.SHOPIFY_SHOP}/admin/oauth/access_token`, {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  summary: async (token: string) => {
    const res = await fetch(`https://${process.env.SHOPIFY_SHOP}/admin/api/2024-10/shop.json`, {
      headers: {"X-Shopify-Access-Token": token},
    });
    const json = await res.json();
    return `Connected to ${json.shop?.name || process.env.SHOPIFY_SHOP}`;
  },
};

const google = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  scopes: "https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
  authorize: (clientId: string, redirectUri: string, state: string) =>
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(
      "https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email"
    )}&state=${state}&access_type=offline&prompt=consent`,
  exchange: async (clientId: string, clientSecret: string, code: string, redirectUri: string) =>
    oauthToken("https://oauth2.googleapis.com/token", {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
};

const meta = {
  clientId: process.env.META_CLIENT_ID,
  clientSecret: process.env.META_CLIENT_SECRET,
  scopes: "ads_management,ads_read,business_management",
  authorize: (clientId: string, redirectUri: string, state: string) =>
    `https://www.facebook.com/v21.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}&scope=${encodeURIComponent("ads_management,ads_read,business_management")}`,
  exchange: async (clientId: string, clientSecret: string, code: string, redirectUri: string) => {
    const url = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.access_token) throw new Error(`Meta token exchange failed: ${JSON.stringify(json)}`);
    return json.access_token as string;
  },
};

const tiktok = {
  clientId: process.env.TIKTOK_CLIENT_KEY,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET,
  scopes: "user.info.basic,video.list",
  authorize: (clientId: string, redirectUri: string, state: string) =>
    `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientId}&scope=${encodeURIComponent(
      "user.info.basic,video.list"
    )}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,
  exchange: async (clientId: string, clientSecret: string, code: string, redirectUri: string) =>
    oauthToken("https://open.tiktokapis.com/v2/oauth/token/", {
      client_key: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
};

const klaviyo = {
  clientId: process.env.KLAVIYO_CLIENT_ID,
  clientSecret: process.env.KLAVIYO_CLIENT_SECRET,
  scopes: "accounts:read lists:read",
  authorize: (clientId: string, redirectUri: string, state: string) =>
    `https://www.klaviyo.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("accounts:read lists:read")}&state=${state}`,
  exchange: async (clientId: string, clientSecret: string, code: string, redirectUri: string) =>
    oauthToken("https://www.klaviyo.com/oauth/token", {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
};

const stripe = {
  clientId: process.env.STRIPE_CLIENT_ID,
  clientSecret: process.env.STRIPE_SECRET_KEY,
  scopes: "read_write",
  authorize: (clientId: string, redirectUri: string, state: string) =>
    `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,
  exchange: async (clientId: string, clientSecret: string, code: string, redirectUri: string) =>
    oauthToken("https://connect.stripe.com/oauth/token", {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  summary: async (token: string) => {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: {authorization: `Bearer ${token}`},
    });
    const json = await res.json();
    return json.available && Array.isArray(json.available)
      ? `Balance ${json.available.map((a: {amount: number}) => a.amount / 100).reduce((x: number, y: number) => x + y, 0)} ` +
          (json.available[0]?.currency || "usd").toUpperCase()
      : "Connected to Stripe";
  },
};

export const providers: Record<string, Provider> = {
  shopify: {id: "shopify", name: "Shopify", mode: "oauth", ...shopify},
  "google-sheets": {id: "google-sheets", name: "Google Sheets", mode: "oauth", ...google},
  gmail: {id: "gmail", name: "Gmail", mode: "oauth", ...google},
  meta: {id: "meta", name: "Meta", mode: "oauth", ...meta},
  "google-ads": {id: "google-ads", name: "Google Ads", mode: "oauth", ...google},
  tiktok: {id: "tiktok", name: "TikTok", mode: "oauth", ...tiktok},
  klaviyo: {id: "klaviyo", name: "Klaviyo", mode: "oauth", ...klaviyo},
  stripe: {id: "stripe", name: "Stripe", mode: "oauth", ...stripe},
  woocommerce: {
    id: "woocommerce",
    name: "WooCommerce",
    mode: "api-key",
    apiKeys: [process.env.WOO_STORE_URL, process.env.WOO_CONSUMER_KEY, process.env.WOO_CONSUMER_SECRET],
  },
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp",
    mode: "api-key",
    apiKeys: [process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID],
  },
  razorpay: {
    id: "razorpay",
    name: "Razorpay",
    mode: "api-key",
    apiKeys: [process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET],
  },
  shiprocket: {
    id: "shiprocket",
    name: "Shiprocket",
    mode: "api-key",
    apiKeys: [process.env.SHIPROCKET_API_TOKEN],
  },
  delhivery: {
    id: "delhivery",
    name: "Delhivery",
    mode: "api-key",
    apiKeys: [process.env.DELHIVERY_API_TOKEN],
  },
  amazon: {
    id: "amazon",
    name: "Amazon",
    mode: "manual",
    manualNote:
      "Amazon SP-API requires an Amazon Developer account, LWA client, and role ARN. Configure these in Amazon Seller Central before connecting.",
  },
  flipkart: {
    id: "flipkart",
    name: "Flipkart",
    mode: "manual",
    manualNote:
      "Flipkart requires a B2B account and approved API access token. Generate credentials in Flipkart Seller Hub, then request a partner token.",
  },
  myntra: {
    id: "myntra",
    name: "Myntra",
    mode: "manual",
    manualNote:
      "Myntra Partner API requires an approved seller integration. Credentials are issued by Myntra Partner Services.",
  },
  magento: {
    id: "magento",
    name: "Magento",
    mode: "manual",
    manualNote: "Enter your store URL and admin REST API token in Settings to connect Magento.",
  },
  bigcommerce: {
    id: "bigcommerce",
    name: "BigCommerce",
    mode: "manual",
    manualNote: "Paste your BigCommerce API account token and store hash in Settings to connect.",
  },
  wix: {
    id: "wix",
    name: "Wix",
    mode: "manual",
    manualNote: "Use your Wix OAuth app client ID/secret. Add WIX_CLIENT_ID and WIX_CLIENT_SECRET to .env.",
  },
};

export function getProvider(id: string): Provider | undefined {
  return providers[id];
}

export function providerState(): string {
  return randomBytes(12).toString("hex");
}

export async function completeOAuth(id: string, code: string): Promise<void> {
  const p = getProvider(id);
  if (!p || p.mode !== "oauth" || !p.exchange) throw new Error("unsupported connector");
  const redirectUri = connectorCallback(id);
  const token = await p.exchange(p.clientId!, p.clientSecret!, code, redirectUri);
  let meta: string | null = null;
  if (p.summary) {
    try {
      meta = await p.summary(token);
    } catch {
      meta = null;
    }
  }
  setConnector(id, {accessToken: token, connectedAt: Date.now(), meta});
}

export function saveApiKeyConnector(id: string, keys: string[]): void {
  setConnector(id, {accessToken: keys.join("|"), connectedAt: Date.now(), meta: "API credentials configured"});
}

export function missingCredentials(p: Provider): string[] {
  if (p.mode === "oauth") {
    const missing: string[] = [];
    if (!p.clientId) missing.push(`${p.name} client ID`);
    if (!p.clientSecret) missing.push(`${p.name} client secret`);
    if (p.id === "shopify" && !process.env.SHOPIFY_SHOP) missing.push("SHOPIFY_SHOP store domain");
    return missing;
  }
  if (p.mode === "api-key") return (p.apiKeys || []).filter((k) => !k) as string[];
  return [];
}

export function envVarFor(id: string, index: number): string {
  const map: Record<string, string[]> = {
    shopify: ["SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET"],
    "google-sheets": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    gmail: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    meta: ["META_CLIENT_ID", "META_CLIENT_SECRET"],
    "google-ads": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    tiktok: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
    klaviyo: ["KLAVIYO_CLIENT_ID", "KLAVIYO_CLIENT_SECRET"],
    stripe: ["STRIPE_CLIENT_ID", "STRIPE_SECRET_KEY"],
    woocommerce: ["WOO_STORE_URL", "WOO_CONSUMER_KEY", "WOO_CONSUMER_SECRET"],
    whatsapp: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
    razorpay: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
    shiprocket: ["SHIPROCKET_API_TOKEN"],
    delhivery: ["DELHIVERY_API_TOKEN"],
  };
  const vars = map[id] || [];
  return vars[index] || "";
}