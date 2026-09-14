import {NextResponse} from "next/server";
import {automations} from "@/lib/data";

export async function GET(){
  return NextResponse.json({data:automations},{headers:{"cache-control":"no-store"}});
}

export async function POST(){
  return NextResponse.json({
    ok:false,
    error:"automation_runtime_not_implemented",
    message:"Automation persistence and execution will be enabled after the real workspace/runtime backend is connected."
  },{status:501});
}
