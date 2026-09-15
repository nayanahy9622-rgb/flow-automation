import {NextResponse} from "next/server";
import {automations} from "@/lib/data";
import {createAutomation,getCurrentUser,listAutomations} from "@/lib/authStore";

export async function GET(){
  const user=await getCurrentUser();
  if(!user)return NextResponse.json({error:"unauthorized"},{status:401});
  const data=await listAutomations(user.id);
  return NextResponse.json({data:data.length?data:automations},{headers:{"cache-control":"no-store"}});
}

export async function POST(req:Request){
  const user=await getCurrentUser();
  if(!user)return NextResponse.json({error:"unauthorized"},{status:401});
  const body=await req.json().catch(()=>null);
  const name=typeof body?.name==="string"?body.name.trim():"";
  const trigger=typeof body?.trigger==="string"?body.trigger.trim():"";
  const action=typeof body?.action==="string"?body.action.trim():"";
  if(!name||!trigger||!action)return NextResponse.json({error:"invalid_automation",message:"name, trigger, and action are required"},{status:400});
  const data=await createAutomation(user.id,{name,trigger,action});
  return NextResponse.json({ok:true,data},{status:201});
}
