import {NextResponse} from "next/server";
import {getProvider} from "@/lib/oauth";
import {setConnector, ConnectorAuth} from "@/lib/connectorStore";

export async function POST(req: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const p = getProvider(id);
  if (!p) return NextResponse.json({ok: false, error: "unknown_connector"}, {status: 404});
  if (p.mode === "oauth") {
    return NextResponse.json(
      {ok: false, error: "This connector uses OAuth. Use the Connect button to authenticate with " + p.name + "."},
      {status: 405}
    );
  }
  if (!p.tokenFields || !p.tokenFields.length) {
    return NextResponse.json({ok: false, error: "This connector does not accept pasted API keys."}, {status: 405});
  }

  const body = await req.json().catch(() => ({}));
  const values = p.tokenFields.map((f) => (typeof body[f.env] === "string" ? (body[f.env] as string).trim() : ""));
  const empty = p.tokenFields.filter((f, i) => !values[i]);
  if (empty.length) {
    return NextResponse.json(
      {ok: false, error: "Missing fields: " + empty.map((f) => f.label).join(", ")},
      {status: 400}
    );
  }

  const auth: ConnectorAuth = {
    accessToken: values.join("|"),
    connectedAt: Date.now(),
    meta: null,
    providerData: {connectionMethod: "api-token"},
  };

  if (p.validate) {
    try {
      await p.validate(auth);
    } catch (e) {
      return NextResponse.json(
        {ok: false, error: `${p.name} rejected these credentials: ${e instanceof Error ? e.message : String(e)}`},
        {status: 502}
      );
    }
  }

  setConnector(id, auth);
  return NextResponse.json({ok: true, connectorId: id});
}