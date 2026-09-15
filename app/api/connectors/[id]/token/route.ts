import {NextResponse} from "next/server";
import {getProvider} from "@/lib/oauth";
import {setConnectorAsync,ConnectorAuth} from "@/lib/connectorStore";
import {validateFlipkart} from "@/lib/flipkartProvider";

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const p=getProvider(id);
 if(!p)return NextResponse.json({ok:false,error:"unknown_connector"},{status:404});
 if(p.mode==="oauth")return NextResponse.json({ok:false,error:"This connector uses OAuth. Use the Connect button to authenticate with "+p.name+"."},{status:405});
 if(!p.tokenFields?.length)return NextResponse.json({ok:false,error:"This connector does not accept pasted API keys."},{status:405});
 const body=await req.json().catch(()=>({}));
 const values=p.tokenFields.map(f=>typeof body[f.env]==="string"?String(body[f.env]).trim():"");
 const empty=p.tokenFields.filter((f,i)=>!values[i]);
 if(empty.length)return NextResponse.json({ok:false,error:"Missing fields: "+empty.map(f=>f.label).join(", ")},{status:400});
 const auth:ConnectorAuth={accessToken:values.join("|"),connectedAt:Date.now(),meta:null,providerData:{connectionMethod:"api-token"}};
 try{
  if(id==="flipkart")await validateFlipkart(auth);
  else if(p.validate)await p.validate(auth);
 }catch(e){return NextResponse.json({ok:false,error:`${p.name} rejected these credentials: ${e instanceof Error?e.message:String(e)}`},{status:502});}
 await setConnectorAsync(id,auth);
 return NextResponse.json({ok:true,connectorId:id});
}
