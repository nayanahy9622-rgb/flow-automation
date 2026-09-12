import {NextResponse} from "next/server";
import {createHmac,timingSafeEqual} from "crypto";

function safeEqual(a:string,b:string):boolean{const x=Buffer.from(a,"utf8"),y=Buffer.from(b,"utf8");return x.length===y.length&&timingSafeEqual(x,y);}

export async function POST(req:Request){
  const raw=await req.text();
  const shopifyHmac=req.headers.get("x-shopify-hmac-sha256");
  const shopifyTopic=req.headers.get("x-shopify-topic");
  const shopifyShop=req.headers.get("x-shopify-shop-domain");
  const generic=req.headers.get("x-webhook-signature");
  let verified=false;

  if(shopifyHmac&&process.env.SHOPIFY_CLIENT_SECRET){
    const digest=createHmac("sha256",process.env.SHOPIFY_CLIENT_SECRET).update(raw,"utf8").digest("base64");
    verified=safeEqual(digest,shopifyHmac);
  } else if(generic&&process.env.WEBHOOK_SIGNING_SECRET){
    const digest=createHmac("sha256",process.env.WEBHOOK_SIGNING_SECRET).update(raw,"utf8").digest("hex");
    verified=safeEqual(digest,generic);
  }
  if(!verified)return NextResponse.json({accepted:false,reason:"invalid_or_missing_signature"},{status:401});

  let body:unknown;try{body=JSON.parse(raw);}catch{body=raw;}
  const eventId=req.headers.get("x-event-id")||req.headers.get("x-shopify-event-id")||`evt_${Date.now()}`;
  return NextResponse.json({accepted:true,eventId,verified:true,provider:shopifyShop?"shopify":"webhook",topic:shopifyTopic||"unknown",received:body});
}
