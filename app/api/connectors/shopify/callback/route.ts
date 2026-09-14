import {createHmac,timingSafeEqual} from "crypto";
import {NextRequest,NextResponse} from "next/server";
import {setConnector} from "@/lib/connectorStore";
import {connectorCallback} from "@/lib/oauth";

function equal(a:string,b:string):boolean{const left=Buffer.from(a,"utf8");const right=Buffer.from(b,"utf8");return left.length===right.length&&timingSafeEqual(left,right);}
function validShop(value:string|null|undefined):string|null{if(!value)return null;const clean=value.trim().toLowerCase().replace(/^https?:\/\//,"").replace(/\/.*$/ ,"").replace(/\.myshopify\.com$/ ,"");return /^[a-z0-9][a-z0-9-]*$/.test(clean)?clean:null;}
function verifyHmac(url:URL,secret:string):boolean{
 const hmac=url.searchParams.get("hmac");
 if(!hmac)return false;
 const params:string[]=[];
 url.searchParams.forEach((value,key)=>{if(key!=="hmac"&&key!=="signature")params.push(`${key}=${value}`);});
 params.sort();
 const digest=createHmac("sha256",secret).update(params.join("&")).digest("hex");
 return equal(digest,hmac);
}
async function exchange(shop:string,code:string){
 const res=await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:process.env.SHOPIFY_CLIENT_ID||"",client_secret:process.env.SHOPIFY_CLIENT_SECRET||"",code,expiring:"1"}),cache:"no-store"});
 const json=await res.json().catch(()=>({}));
 if(!res.ok||!json.access_token)throw new Error("Shopify token exchange failed");
 return json;
}

export async function GET(req:NextRequest){
 const url=new URL(req.url);
 const state=url.searchParams.get("state");
 const code=url.searchParams.get("code");
 const error=url.searchParams.get("error");
 const savedState=req.cookies.get("tentran_shopify_oauth_state")?.value;
 const savedShop=validShop(req.cookies.get("tentran_shopify_oauth_shop")?.value);
 const shop=validShop(url.searchParams.get("shop"));
 if(error)return NextResponse.redirect(new URL(`/?connector_error=${encodeURIComponent(error)}`,req.url));
 if(!state||!savedState||!equal(state,savedState)||!code||!savedShop||!shop||savedShop!==shop)return new NextResponse("Invalid Shopify OAuth callback",{status:403});
 if(!process.env.SHOPIFY_CLIENT_ID||!process.env.SHOPIFY_CLIENT_SECRET)return new NextResponse("Shopify OAuth is not configured on the server",{status:503});
 if(!verifyHmac(url,process.env.SHOPIFY_CLIENT_SECRET))return new NextResponse("Invalid Shopify callback signature",{status:403});
 try{
  const token=await exchange(shop,code);
  setConnector("shopify",{accessToken:String(token.access_token),refreshToken:token.refresh_token?String(token.refresh_token):undefined,expiresAt:token.expires_in?Date.now()+Number(token.expires_in)*1000:undefined,tokenType:token.token_type?String(token.token_type):"Bearer",scope:token.scope?String(token.scope):undefined,connectedAt:Date.now(),meta:`Shopify · ${shop}.myshopify.com`,providerData:{shop,refreshTokenExpiresAt:token.refresh_token_expires_in?String(Date.now()+Number(token.refresh_token_expires_in)*1000):""}});
  const response=NextResponse.redirect(new URL("/?connected=shopify",req.url));
  response.cookies.set("tentran_shopify_oauth_state","",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:0});
  response.cookies.set("tentran_shopify_oauth_shop","",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:0});
  return response;
 }catch{return NextResponse.redirect(new URL("/?connector_error=shopify",req.url));}
}
