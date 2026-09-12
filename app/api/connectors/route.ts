import {NextResponse} from "next/server";
import {listAuth} from "@/lib/connectorStore";
import {connectors} from "@/lib/data";

export async function GET() {
  const auth = listAuth();
  const data = connectors.map((c) => ({
    ...c,
    status: auth[`connector:${c.id}`] ? "connected" : c.status === "error" ? "error" : "available",
    meta: auth[`connector:${c.id}`]?.meta ?? null,
  }));
  return NextResponse.json({data}, {headers: {"cache-control": "no-store"}});
}

export async function POST() {
  return NextResponse.json(
    {ok: false, error: "Use /api/connectors/:id/connect to start a real provider connection."},
    {status: 405, headers: {allow: "GET"}}
  );
}
