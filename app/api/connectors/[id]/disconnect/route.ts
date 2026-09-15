import {NextResponse} from "next/server";
import {removeConnectorAsync} from "@/lib/connectorStore";
export async function POST(_req:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;await removeConnectorAsync(id);return NextResponse.json({ok:true,connectorId:id,status:"disconnected"});}
