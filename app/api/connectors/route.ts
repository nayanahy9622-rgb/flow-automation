import {NextResponse} from "next/server";
import {connectors} from "@/lib/data";
import {getConnector} from "@/lib/connectorStore";

export async function GET(){
 const data=connectors.map(c=>{
  const auth=(c.id==="shopify"||c.id==="razorpay")?getConnector(c.id):undefined;
  const connected=Boolean(auth);
  return {...c,mode:c.id==="shopify"?"oauth":c.id==="razorpay"?"api-key":"unavailable",manualNote:null,fields:null,status:connected?"connected":c.status,meta:auth?.meta||null};
 });
 return NextResponse.json({data},{headers:{"cache-control":"no-store"}});
}

export async function POST(){
 return NextResponse.json({ok:false,error:"Use the provider-specific connection route."},{status:405,headers:{allow:"GET"}});
}
