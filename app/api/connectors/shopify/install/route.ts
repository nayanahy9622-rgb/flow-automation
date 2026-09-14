import {createHmac,timingSafeEqual,randomBytes} from "crypto";
import {NextResponse} from "next/server";

function equal(a:string,b:string):boolean{
 const left=Buffer.from(a,"utf8");
 const right=Buffer.from(b,"utf8");
 return left.length===right.length&&timingSafeEqual(left,right);
}

function validShop(value:string|null):string|null{
 if(!value)return null;
 const clean=value.trim().toLowerCase().replace(/^https?:\/\//,"").replace(/\/.*$/ ,"").replace(/\.myshopify\.com$/ ,"");
 return /^[a-z0-9][a-z0-9-]*$/.test(clean)?clean:null;
}

function verifyInstallRequest(url:URL,secret:string):boolean{
 const hmac=url.searchParams.get("hmac");
 if(!hmac)return false;
 const params:string[]=[];
 url.searchParams.forEach((value,key)=>{
  if(key!=="hmac"&&key!=="signature")params.push(`${key}=${value}`);
 });
 params.sort();
 const digest=createHmac("sha256",secret).update(params.join("&")).digest("hex");
 return equal(digest,hmac);
}

export async function GET(req:Request){
 const url=new URL(req.url);
 const shop=validShop(url.searchParams.get("shop"));
 const secret=process.env.SHOPIFY_CLIENT_SECRET;
 const clientId=process.env.SHOPIFY_CLIENT_ID;
 const timestamp=Number(url.searchParams.get("timestamp")||0);

 if(!shop||!secret||!clientId){
  return new NextResponse("Shopify installation request is missing required configuration or store information",{status:400});
 }
 if(!timestamp||Math.abs(Math.floor(Date.now()/1000)-timestamp)>600){
  return new NextResponse("Expired Shopify installation request",{status:400});
 }
 if(!verifyInstallRequest(url,secret)){
  return new NextResponse("Invalid Shopify installation signature",{status:403});
 }

 const state=randomBytes(32).toString("base64url");
 const callback=new URL("/api/connectors/shopify/callback",url.origin).toString();
 const scopes="read_products,read_orders,read_customers,read_inventory,write_products";
 const authorize=new URL(`https://${shop}.myshopify.com/admin/oauth/authorize`);
 authorize.searchParams.set("client_id",clientId);
 authorize.searchParams.set("scope",scopes);
 authorize.searchParams.set("redirect_uri",callback);
 authorize.searchParams.set("state",state);

 const response=NextResponse.redirect(authorize);
 response.cookies.set("tentran_shopify_oauth_state",state,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:600});
 response.cookies.set("tentran_shopify_oauth_shop",shop,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:600});
 return response;
}
