import {NextResponse} from "next/server";
import {getProvider, providerState, connectorCallback, missingCredentials, envVarFor, saveApiKeyConnector} from "@/lib/oauth";
import {setConnector} from "@/lib/connectorStore";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char] || char);
}

function helpHtml(p: {name: string}, vars: string[], note?: string): Response {
  return new NextResponse(
    `<!doctype html><html><body style="font-family:system-ui;background:#0b0d11;color:#e8ecf1;display:grid;place-items:center;min-height:100vh;margin:0"><div style="max-width:560px;background:#12161d;border:1px solid #262c36;border-radius:14px;padding:32px;"><h1 style="margin:0 0 8px;font-size:20px">${escapeHtml(p.name)} needs credentials</h1><p style="color:#8b94a3;font-size:13px;line-height:1.6">Add <b>${vars.map((v) => `<code style="color:#9ecbff">${escapeHtml(v)}</code>`).join(" and ")}</b> to <b>.env</b> (copy from <b>.env.example</b>) and restart the server. Credentials stay server-side.</p><p style="color:#8b94a3;font-size:13px;line-height:1.6">${escapeHtml(note || "")}</p><a href="/" style="display:inline-block;margin-top:14px;padding:9px 16px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-size:13px">Back to app</a></div></body></html>`,
    {headers: {"content-type": "text/html"}}
  );
}

function validShop(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.myshopify\.com$/, "");
  return /^[a-z0-9][a-z0-9-]*$/.test(clean) ? clean : null;
}

export async function POST(req: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  if (id !== "shopify") return NextResponse.json({ok:false,error:"use_provider_connection_flow"},{status:405});
  const body = await req.json().catch(() => ({}));
  const shop = validShop(body.shop);
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!shop || !token) return NextResponse.json({ok:false,error:"shop_and_token_required"},{status:400});
  const res = await fetch(`https://${shop}.myshopify.com/admin/api/2026-07/graphql.json`, {
    method:"POST", cache:"no-store", headers:{"content-type":"application/json","X-Shopify-Access-Token":token},
    body:JSON.stringify({query:"query { shop { id name email myshopifyDomain } }"}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors?.length || !json.data?.shop?.id) return NextResponse.json({ok:false,error:"Shopify rejected the access token or required Admin API permissions are missing."},{status:502});
  setConnector("shopify", {accessToken:token,connectedAt:Date.now(),meta:`Shopify · ${shop}.myshopify.com`,providerData:{shop,connectionMethod:"api-token"}});
  return NextResponse.json({ok:true,connectorId:"shopify",shop:json.data.shop});
}

export async function GET(req: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const p = getProvider(id);
  if (!p) return NextResponse.json({error: "unknown connector"}, {status: 404});
  if (id === "shopify") return NextResponse.redirect(new URL("/connectors/shopify", process.env.APP_URL || req.url));
  if (id === "gmail") return NextResponse.redirect(new URL("/api/connectors/gmail/oauth", process.env.APP_URL || req.url));

  const missing = missingCredentials(p);
  if (missing.length) {
    const vars = Array.from({length: missing.length}, (_, i) => envVarFor(id, i));
    return helpHtml(p, vars, p.mode === "manual" ? p.manualNote : undefined);
  }
  if (p.mode === "api-key") {
    saveApiKeyConnector(id, p.apiKeys!.filter((k): k is string => Boolean(k)));
    return NextResponse.redirect(new URL("/?connected=" + encodeURIComponent(id), process.env.APP_URL || req.url));
  }
  if (p.mode === "manual") return helpHtml(p, [], p.manualNote);

  const state = providerState();
  const url = p.authorize!(p.clientId!, connectorCallback(id), state);
  const response = NextResponse.redirect(url);
  response.cookies.set("flowos_oauth_state", state, {httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV === "production",path:"/",maxAge:600});
  return response;
}
