import {NextResponse} from "next/server";
import {listAuth} from "@/lib/connectorStore";
import {connectors} from "@/lib/data";
import {getProvider} from "@/lib/oauth";

export async function GET() {
  const auth = listAuth();
  const data = connectors.map((c) => {
    const p = getProvider(c.id);
    return {
      ...c,
      mode: p?.mode ?? "manual",
      manualNote: p?.manualNote ?? null,
      fields: p?.tokenFields?.map((f) => ({env: f.env, label: f.label, placeholder: f.placeholder, secret: f.secret})) ?? null,
      status: auth[`connector:${c.id}`] ? "connected" : c.status === "error" ? "error" : "available",
      meta: auth[`connector:${c.id}`]?.meta ?? null,
    };
  });
  return NextResponse.json({data}, {headers: {"cache-control": "no-store"}});
}

export async function POST() {
  return NextResponse.json(
    {ok: false, error: "Use /api/connectors/:id/connect to start a real provider connection."},
    {status: 405, headers: {allow: "GET"}}
  );
}
