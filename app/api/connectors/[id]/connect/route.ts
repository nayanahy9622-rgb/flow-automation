import {NextResponse} from "next/server";
import {getProvider, providerState, connectorCallback, missingCredentials, envVarFor, saveApiKeyConnector} from "@/lib/oauth";

function helpHtml(p: {name: string}, vars: string[], note?: string): Response {
  return new NextResponse(
    `<!doctype html><html><body style="font-family:system-ui;background:#0b0d11;color:#e8ecf1;display:grid;place-items:center;min-height:100vh;margin:0">
    <div style="max-width:560px;background:#12161d;border:1px solid #262c36;border-radius:14px;padding:32px;">
      <h1 style="margin:0 0 8px;font-size:20px">${p.name} needs credentials</h1>
      <p style="color:#8b94a3;font-size:13px;line-height:1.6">Add <b>${vars.map((v) => `<code style="color:#9ecbff">${v}</code>`).join(" and ")}</b> to <b>.env</b> (copy from <b>.env.example</b>) and restart the dev server. Your credentials are <b>never</b> exposed to the browser.</p>
      <p style="color:#8b94a3;font-size:13px;line-height:1.6">${note || ""}</p>
      <a href="/" style="display:inline-block;margin-top:14px;padding:9px 16px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-size:13px">Back to app</a>
    </div></body></html>`,
    {headers: {"content-type": "text/html"}}
  );
}

export async function GET(req: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const p = getProvider(id);
  if (!p) return NextResponse.json({error: "unknown connector"}, {status: 404});

  const missing = missingCredentials(p);
  if (missing.length) {
    const vars = Array.from({length: missing.length}, (_, i) => envVarFor(id, i));
    return helpHtml(p, vars, p.mode === "manual" ? p.manualNote : undefined);
  }

  if (p.mode === "api-key") {
    saveApiKeyConnector(id, p.apiKeys!.filter((k): k is string => Boolean(k)));
    return NextResponse.redirect(new URL("/?connected=" + id, process.env.APP_URL || req.url));
  }

  if (p.mode === "manual") {
    return helpHtml(p, [], p.manualNote);
  }

  const state = providerState();
  const url = p.authorize!(p.clientId!, connectorCallback(id), state);
  const res = NextResponse.redirect(url);
  res.cookies.set("flowos_oauth_state", state, {httpOnly: true, sameSite: "lax", path: "/"});
  return res;
}