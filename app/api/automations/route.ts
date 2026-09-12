import {NextResponse} from "next/server"; import {automations} from "@/lib/data";
export async function GET(){return NextResponse.json({data:automations})}
export async function POST(req:Request){const body=await req.json(); return NextResponse.json({ok:true,data:{...body,id:"new_"+Date.now(),status:"draft",runs:0}}, {status:201})}