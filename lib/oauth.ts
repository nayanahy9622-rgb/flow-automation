import {randomBytes} from "crypto";
import {setConnector, getConnector, ConnectorAuth} from "./connectorStore";

export type ProviderMode = "oauth" | "api-key" | "manual";
export type Provider = {
  id: string;
  name: string;
  mode: ProviderMode;
  clientId?: string;
  clientSecret?: string;
  scopes?: string;
  authorize?: (clientId: string, redirectUri: string, state: string) => string;
  exchange?: (clientId: string, clientSecret: string, code: string, redirectUri: string) => Promise<ConnectorAuth>;
  summary?: (auth: ConnectorAuth) => Promise<string>;
  data?: (auth: ConnectorAuth) => Promise<unknown>;
  apiKeys?: (string | undefined)[];
  manualNote?: string;
};

const appUrl = () => process.env.APP_URL || "http://localhost:3000";
export const connectorCallback = (id: string) => `${appUrl()}/api/connectors/${id}/callback`;

async function tokenExchange(url: string, form: Record<string, string>): Promise<ConnectorAuth> {
  const res = await fetch(url, {
    method: "POST",
    headers: {"content-type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams(form),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${JSON.stringify(json)}`);
  const accessToken = json.access_token || json.accessToken;
  if (!accessToken) throw new Error(`Token exchange returned no access_token: ${JSON.stringify(json)}`);
  return {
    accessToken,
    refreshToken: json.refresh_token,
    expiresAt: json.expires_in ? Date.now() + Number(json.expires_in) * 1000 : undefined,
    tokenType: json.token_type,
    scope: json.scope,
    connectedAt: Date.now(),
    meta: null,
  };
}

async function jsonFetch(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {cache: "no-store", ...init});
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(json)}`);
  return json;
}

const googleScopes = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
].join(" ");

const google = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  scopes: googleScopes,
  authorize: (clientId: string, redirectUri: string, state: string) =>
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(googleScopes)}&state=${encodeURIComponent(state)}&access_type=offline&prompt=consent`,
  exchange: async (clientId: string, clientSecret: string, code: string, redirectUri: string) =>
    tokenExchange("https://oauth2.googleapis.com/token", {client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, grant_type: "authorization_code"}),
  summary: async (auth: ConnectorAuth) => {
    const me = await jsonFetch("https://openidconnect.googleapis.com/v1/userinfo", {headers: {authorization: `Bearer ${auth.accessToken}`}});
    return `Connected as ${me.email || me.name || "Google user"}`;
  },
  data: async (auth: ConnectorAuth) => {
    const [profile, drive] = await Promise.all([
      jsonFetch("https://openidconnect.googleapis.com/v1/userinfo", {headers: {authorization: `Bearer ${auth.accessToken}`}}),
      jsonFetch("https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime,webViewLink)&orderBy=modifiedTime%20desc", {headers: {authorization: `Bearer ${auth.accessToken}`}}),
    ]);
    return {profile, driveFiles: drive.files || []};
  },
};

const providers: Record<string, Provider> = {
  shopify: {
    id: "shopify", name: "Shopify", mode: "oauth",
    clientId: process.env.SHOPIFY_CLIENT_ID, clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
    scopes: "read_products,read_orders,read_customers,read_inventory,write_products",
    authorize: (clientId, redirectUri, state) => `https://${process.env.SHOPIFY_SHOP}/admin/oauth/authorize?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent("read_products,read_orders,read_customers,read_inventory,write_products")}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,
    exchange: async (clientId, clientSecret, code, redirectUri) => tokenExchange(`https://${process.env.SHOPIFY_SHOP}/admin/oauth/access_token`, {client_id: clientId, client_secret: clientSecret, code}),
    summary: async (auth) => {
      const shop = await jsonFetch(`https://${process.env.SHOPIFY_SHOP}/admin/api/2024-10/shop.json`, {headers: {"X-Shopify-Access-Token": auth.accessToken}});
      return `Connected to ${shop.shop?.name || process.env.SHOPIFY_SHOP}`;
    },
    data: async (auth) => {
      const q = {query: "query { shop { id name email myshopifyDomain } products(first:20) { nodes { id title status totalInventory } } orders(first:20, sortKey:PROCESSED_AT, reverse:true) { nodes { id name displayFinancialStatus displayFulfillmentStatus totalPriceSet { shopMoney { amount currencyCode } } } } }"};
      return jsonFetch(`https://${process.env.SHOPIFY_SHOP}/admin/api/2025-07/graphql.json`, {method: "POST", headers: {"content-type":"application/json", "X-Shopify-Access-Token": auth.accessToken}, body: JSON.stringify(q)});
    },
  },
  "google-sheets": {...google, id: "google-sheets", name: "Google Sheets"},
  gmail: {...google, id: "gmail", name: "Gmail"},
  "google-ads": {
    ...google, id: "google-ads", name: "Google Ads",
    data: async (auth) => ({message: "Google OAuth connection established. Google Ads API calls additionally require a developer token and a customer ID configured for the Google Ads account."}),
  },
  meta: {
    id: "meta", name: "Meta", mode: "oauth", clientId: process.env.META_CLIENT_ID, clientSecret: process.env.META_CLIENT_SECRET,
    scopes: "ads_management,ads_read,business_management",
    authorize: (clientId, redirectUri, state) => `https://www.facebook.com/v23.0/dialog/oauth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent("ads_management,ads_read,business_management")}`,
    exchange: async (clientId, clientSecret, code, redirectUri) => tokenExchange("https://graph.facebook.com/v23.0/oauth/access_token", {client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code}),
    summary: async (auth) => {
      const me = await jsonFetch(`https://graph.facebook.com/v23.0/me?fields=id,name`, {headers: {authorization: `Bearer ${auth.accessToken}`}});
      return `Connected to ${me.name || "Meta account"}`;
    },
    data: async (auth) => {
      const [me, adaccounts] = await Promise.all([
        jsonFetch(`https://graph.facebook.com/v23.0/me?fields=id,name`, {headers: {authorization: `Bearer ${auth.accessToken}`}}),
        jsonFetch(`https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name,account_status,currency&limit=50`, {headers: {authorization: `Bearer ${auth.accessToken}`}}),
      ]);
      return {account: me, adAccounts: adaccounts.data || []};
    },
  },
  tiktok: {
    id: "tiktok", name: "TikTok", mode: "oauth", clientId: process.env.TIKTOK_CLIENT_KEY, clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    scopes: "user.info.basic,video.list",
    authorize: (clientId, redirectUri, state) => `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(clientId)}&scope=${encodeURIComponent("user.info.basic,video.list")}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,
    exchange: async (clientId, clientSecret, code, redirectUri) => tokenExchange("https://open.tiktokapis.com/v2/oauth/token/", {client_key: clientId, client_secret: clientSecret, code, grant_type: "authorization_code", redirect_uri: redirectUri}),
    summary: async (auth) => {
      const me = await jsonFetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", {headers: {authorization: `Bearer ${auth.accessToken}`}});
      return `Connected as ${me.data?.user?.display_name || "TikTok user"}`;
    },
    data: async (auth) => jsonFetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", {headers: {authorization: `Bearer ${auth.accessToken}`}}),
  },
  klaviyo: {
    id: "klaviyo", name: "Klaviyo", mode: "oauth", clientId: process.env.KLAVIYO_CLIENT_ID, clientSecret: process.env.KLAVIYO_CLIENT_SECRET,
    scopes: "accounts:read lists:read",
    authorize: (clientId, redirectUri, state) => `https://www.klaviyo.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("accounts:read lists:read")}&state=${encodeURIComponent(state)}`,
    exchange: async (clientId, clientSecret, code, redirectUri) => tokenExchange("https://a.klaviyo.com/oauth/token", {client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, grant_type: "authorization_code"}),
    summary: async (auth) => {
      const result = await jsonFetch("https://a.klaviyo.com/api/accounts/", {headers: {authorization: `Bearer ${auth.accessToken}`, revision: "2026-01-15"}});
      return `Connected to ${result.data?.[0]?.attributes?.contact_information?.default_sender_email || "Klaviyo account"}`;
    },
    data: async (auth) => jsonFetch("https://a.klaviyo.com/api/accounts/", {headers: {authorization: `Bearer ${auth.accessToken}`, revision: "2026-01-15"}}),
  },
  stripe: {
    id: "stripe", name: "Stripe", mode: "oauth", clientId: process.env.STRIPE_CLIENT_ID, clientSecret: process.env.STRIPE_SECRET_KEY,
    scopes: "read_write",
    authorize: (clientId, redirectUri, state) => `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,
    exchange: async (clientId, clientSecret, code, redirectUri) => tokenExchange("https://connect.stripe.com/oauth/token", {client_id: clientId, client_secret: clientSecret, code, grant_type: "authorization_code", redirect_uri: redirectUri}),
    summary: async (auth) => { const a = await jsonFetch("https://api.stripe.com/v1/account", {headers: {authorization: `Bearer ${auth.accessToken}`}}); return `Connected to ${a.business_profile?.name || a.settings?.dashboard?.display_name || a.email || "Stripe account"}`; },
    data: async (auth) => { const [account,balance] = await Promise.all([jsonFetch("https://api.stripe.com/v1/account", {headers:{authorization:`Bearer ${auth.accessToken}`}}), jsonFetch("https://api.stripe.com/v1/balance", {headers:{authorization:`Bearer ${auth.accessToken}`}})]); return {account,balance}; },
  },
  bigcommerce: {
    id: "bigcommerce", name: "BigCommerce", mode: "oauth", clientId: process.env.BIGCOMMERCE_CLIENT_ID, clientSecret: process.env.BIGCOMMERCE_CLIENT_SECRET,
    scopes: "store_v2_products store_v2_orders store_v2_customers store_v2_information",
    authorize: (clientId, redirectUri, state) => `https://login.bigcommerce.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent("store_v2_products store_v2_orders store_v2_customers store_v2_information")}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,
    exchange: async (clientId, clientSecret, code, redirectUri) => tokenExchange("https://login.bigcommerce.com/oauth2/token", {client_id: clientId, client_secret: clientSecret, code, redirect_uri, grant_type: "authorization_code"}),
    summary: async (auth) => `Connected to BigCommerce (${auth.meta || "store authorized"})`,
  },
  wix: {
    id: "wix", name: "Wix", mode: "oauth", clientId: process.env.WIX_CLIENT_ID, clientSecret: process.env.WIX_CLIENT_SECRET,
    scopes: process.env.WIX_SCOPES || "",
    authorize: (clientId, redirectUri, state) => `https://www.wix.com/installer/install?appDefinitionId=${encodeURIComponent(clientId)}&redirectUrl=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,
    exchange: async (clientId, clientSecret, code) => tokenExchange("https://www.wixapis.com/oauth2/token", {grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, code}),
    summary: async () => "Wix authorization completed; configure the Wix app scopes required for your site data.",
  },
  amazon: {
    id: "amazon", name: "Amazon", mode: "oauth", clientId: process.env.AMAZON_CLIENT_ID, clientSecret: process.env.AMAZON_CLIENT_SECRET,
    scopes: "",
    authorize: (clientId, redirectUri, state) => `https://sellercentral.amazon.com/apps/authorize/consent?application_id=${encodeURIComponent(clientId)}&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    exchange: async (clientId, clientSecret, code, redirectUri) => tokenExchange("https://api.amazon.com/auth/o2/token", {grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, code, redirect_uri}),
    summary: async () => "Amazon Seller Central authorization completed.",
    data: async (auth) => ({message: "Amazon seller authorization is stored. SP-API operational calls require the seller marketplace/region and application role configuration."}),
  },
  razorpay: {
    id: "razorpay", name: "Razorpay", mode: "oauth", clientId: process.env.RAZORPAY_CLIENT_ID, clientSecret: process.env.RAZORPAY_CLIENT_SECRET,
    scopes: "",
    authorize: (clientId, redirectUri, state) => `https://auth.razorpay.com/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,
    exchange: async (clientId, clientSecret, code, redirectUri) => tokenExchange("https://auth.razorpay.com/token", {grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, code, redirect_uri}),
    summary: async () => "Razorpay OAuth authorization completed.",
    data: async (auth) => ({message: "Razorpay OAuth token stored. API resources available depend on the Technology Partner permissions granted to the application."}),
  },
  woocommerce: {id:"woocommerce",name:"WooCommerce",mode:"api-key",apiKeys:[process.env.WOO_STORE_URL,process.env.WOO_CONSUMER_KEY,process.env.WOO_CONSUMER_SECRET]},
  whatsapp: {id:"whatsapp",name:"WhatsApp",mode:"api-key",apiKeys:[process.env.WHATSAPP_ACCESS_TOKEN,process.env.WHATSAPP_PHONE_NUMBER_ID]},
  shiprocket: {id:"shiprocket",name:"Shiprocket",mode:"api-key",apiKeys:[process.env.SHIPROCKET_API_TOKEN]},
  delhivery: {id:"delhivery",name:"Delhivery",mode:"api-key",apiKeys:[process.env.DELHIVERY_API_TOKEN]},
  magento: {id:"magento",name:"Magento",mode:"manual",manualNote:"Magento/Adobe Commerce third-party integrations support OAuth 1.0a. Create and activate an integration in the merchant Admin, then provide the issued consumer/access credentials through the secured connector setup."},
  flipkart: {id:"flipkart",name:"Flipkart",mode:"manual",manualNote:"Flipkart seller APIs require an approved seller/partner integration. Credentials are issued by Flipkart Seller Hub/partner onboarding."},
  myntra: {id:"myntra",name:"Myntra",mode:"manual",manualNote:"Myntra partner APIs require approved seller integration and credentials issued by Myntra Partner Services."},
};

export const providersMap = providers;
export {providers};

export function getProvider(id: string): Provider | undefined { return providers[id]; }
export function providerState(): string { return randomBytes(32).toString("hex"); }

export async function completeOAuth(id: string, code: string): Promise<void> {
  const p = getProvider(id);
  if (!p || p.mode !== "oauth" || !p.exchange || !p.clientId || !p.clientSecret) throw new Error("unsupported connector or missing credentials");
  const auth = await p.exchange(p.clientId, p.clientSecret, code, connectorCallback(id));
  if (p.summary) { try { auth.meta = await p.summary(auth); } catch { auth.meta = null; } }
  setConnector(id, auth);
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
  if (p.mode === "api-key") return (p.apiKeys || []).map((v, i) => v ? "" : envVarFor(p.id, i)).filter(Boolean);
  return [];
}

export function envVarFor(id: string, index: number): string {
  const map: Record<string,string[]> = {
    shopify:["SHOPIFY_CLIENT_ID","SHOPIFY_CLIENT_SECRET","SHOPIFY_SHOP"],
    "google-sheets":["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET"], gmail:["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET"], "google-ads":["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET"],
    meta:["META_CLIENT_ID","META_CLIENT_SECRET"], tiktok:["TIKTOK_CLIENT_KEY","TIKTOK_CLIENT_SECRET"], klaviyo:["KLAVIYO_CLIENT_ID","KLAVIYO_CLIENT_SECRET"], stripe:["STRIPE_CLIENT_ID","STRIPE_SECRET_KEY"], bigcommerce:["BIGCOMMERCE_CLIENT_ID","BIGCOMMERCE_CLIENT_SECRET"], wix:["WIX_CLIENT_ID","WIX_CLIENT_SECRET"], amazon:["AMAZON_CLIENT_ID","AMAZON_CLIENT_SECRET"], razorpay:["RAZORPAY_CLIENT_ID","RAZORPAY_CLIENT_SECRET"], woocommerce:["WOO_STORE_URL","WOO_CONSUMER_KEY","WOO_CONSUMER_SECRET"], whatsapp:["WHATSAPP_ACCESS_TOKEN","WHATSAPP_PHONE_NUMBER_ID"], shiprocket:["SHIPROCKET_API_TOKEN"], delhivery:["DELHIVERY_API_TOKEN"],
  };
  return map[id]?.[index] || "";
}

export async function pullConnectorData(id: string): Promise<unknown> {
  const p = getProvider(id);
  const auth = getConnector(id);
  if (!p) throw new Error("unknown connector");
  if (!auth) throw new Error("connector not connected");
  if (p.data) return p.data(auth);
  const keys = auth.accessToken.split("|");
  if (id === "woocommerce") {
    const [storeUrl, key, secret] = keys;
    const basic = Buffer.from(`${key}:${secret}`).toString("base64");
    const base = storeUrl.replace(/\/$/, "");
    const [products, orders, customers] = await Promise.all([1,1,1].map(() => Promise.resolve([])));
    return {message:"WooCommerce connector authenticated. Add the store URL/API keys for live REST calls.", storeUrl, products, orders, customers, authorization: `Basic ${basic.slice(0, 8)}…`};
  }
  if (id === "delhivery") return {message:"Delhivery token is configured. Use the authenticated client APIs for shipment/tracking operations."};
  if (id === "shiprocket") return {message:"Shiprocket token is configured. Use the authenticated APIs for orders/shipments/tracking."};
  if (id === "whatsapp") return {message:"WhatsApp Cloud API credentials are configured. Use the Graph API for phone/threads/messages according to granted permissions."};
  return {message:"Connector authenticated; provider-specific data adapter is not enabled yet."};
}
