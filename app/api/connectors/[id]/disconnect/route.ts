import {NextResponse} from "next/server";
import {removeConnector} from "@/lib/connectorStore";

export async function POST(_req: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  removeConnector(id);
  return NextResponse.json({ok: true, connectorId: id, status: "disconnected"});
}