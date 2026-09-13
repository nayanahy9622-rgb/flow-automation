import {NextRequest,NextResponse} from "next/server";
import {getConnector} from "@/lib/connectorStore";
import {pullConnectorData} from "@/lib/oauth";
import {getGmailData} from "@/lib/gmail";
import {githubData} from "@/lib/githubData";

export async function GET(req:NextRequest){
 const id=new URL(req.url).searchParams.get("id");
 if(!id)return NextResponse.json({ok:false,error:"missing_connector_id"},{status:400});
 try{
  if(id==="github"){
   const userId=req.cookies.get("flowos_github_user")?.value;
   if(!userId)return NextResponse.json({ok:false,error:"connector_not_connected"},{status:404,headers:{"cache-control":"no-store"}});
   const data=await githubData(userId);
   return NextResponse.json({ok:true,connectorId:id,data},{headers:{"cache-control":"no-store"}});
  }
  const auth=getConnector(id);if(!auth)return NextResponse.json({ok:false,error:"connector_not_connected"},{status:404,headers:{"cache-control":"no-store"}});
  const data=id==="gmail"?await getGmailData(auth):await pullConnectorData(id);
  return NextResponse.json({ok:true,connectorId:id,data},{headers:{"cache-control":"no-store"}});
 }catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:"connector_data_failed"},{status:502,headers:{"cache-control":"no-store"}});}
}
