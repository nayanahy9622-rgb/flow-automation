import {NextRequest,NextResponse} from "next/server";

export async function GET(req:NextRequest){
  const id=new URL(req.url).searchParams.get("id");
  if(!id)return NextResponse.json({ok:false,error:"missing_connector_id"},{status:400});
  return NextResponse.json({ok:false,error:"connector_not_implemented",message:`${id} does not have a live data provider yet.`},{status:501,headers:{"cache-control":"no-store"}});
}
