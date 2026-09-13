import {NextRequest,NextResponse} from "next/server";

export async function GET(req:NextRequest){
  const code=new URL(req.url).searchParams.get("code");
  if(!code)return new NextResponse("GitHub authorization was not completed",{status:400});
  return NextResponse.json({ok:false,error:"GitHub callback wiring is pending server credential exchange"},{status:501});
}
