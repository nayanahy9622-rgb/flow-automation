import {NextResponse} from "next/server";

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return NextResponse.json({ok:false,error:"connector_not_implemented",message:`${id} does not have a live connection flow yet.`},{status:501});
}

export async function POST(_req:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return NextResponse.json({ok:false,error:"connector_not_implemented",message:`${id} does not have a live connection flow yet.`},{status:501});
}
