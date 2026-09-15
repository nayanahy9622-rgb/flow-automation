import {NextResponse} from "next/server";
import {setConnector} from "@/lib/connectorStore";

function validKeyId(value:string):boolean{
 return /^rzp_(test|live)_[A-Za-z0-9]+$/.test(value.trim());
}

export async function POST(req:Request){
 try{
  const body=await req.json().catch(()=>({}));
  const keyId=String(body.keyId||"").trim();
  const keySecret=String(body.keySecret||"").trim();
  if(!validKeyId(keyId)||!keySecret){
   return NextResponse.json({ok:false,error:"Enter a valid Razorpay Key ID and Key Secret."},{status:400});
  }
  const mode=keyId.startsWith("rzp_live_")?"live":"test";
  const auth=Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res=await fetch("https://api.razorpay.com/v1/payments?count=1",{
   headers:{Authorization:`Basic ${auth}`},
   cache:"no-store"
  });
  const json=await res.json().catch(()=>({}));
  if(!res.ok){
   return NextResponse.json({ok:false,error:"Razorpay rejected these credentials.",details:json?.error?.description||"Authentication failed."},{status:401});
  }
  setConnector("razorpay",{
   accessToken:keySecret,
   tokenType:"Basic",
   connectedAt:Date.now(),
   meta:`Razorpay · ${mode} mode`,
   providerData:{keyId,mode}
  });
  return NextResponse.json({ok:true,provider:"razorpay",mode,meta:`Razorpay · ${mode} mode`},{headers:{"cache-control":"no-store"}});
 }catch(error){
  return NextResponse.json({ok:false,error:"Razorpay connection failed",message:error instanceof Error?error.message:"Request failed"},{status:502});
 }
}
