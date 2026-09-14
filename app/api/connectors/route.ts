import {NextResponse} from "next/server";
import {connectors} from "@/lib/data";

export async function GET(){
  const data=connectors.map((c)=>({
    ...c,
    mode:"unavailable",
    manualNote:null,
    fields:null,
    status:c.status,
    meta:null,
  }));
  return NextResponse.json({data},{headers:{"cache-control":"no-store"}});
}

export async function POST(){
  return NextResponse.json({ok:false,error:"Use the provider-specific connection route."},{status:405,headers:{allow:"GET"}});
}
