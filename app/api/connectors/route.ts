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
  return NextResponse.json({data});
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({ok: true, connector: body, status: "connection_pending"}, {status: 202});
}