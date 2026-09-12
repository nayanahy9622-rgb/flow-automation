import {NextResponse} from "next/server";
import {connectors} from "@/lib/data";
export async function GET(){return NextResponse.json({data:connectors})}
export async function POST(req:Request){const body=await req.json(); return NextResponse.json({ok:true,connector:body,status:"connection_pending"},{status:202})}
