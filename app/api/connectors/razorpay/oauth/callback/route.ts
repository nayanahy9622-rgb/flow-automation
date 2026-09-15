import {timingSafeEqual} from "crypto";
import {NextResponse} from "next/server";
import {setConnectorAsync} from "@/lib/connectorStore";

function same(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
async function exchange(code:string,redirectUri:string,mode:string){const res=await fetch("https://auth.razorpay.com/token",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({client_id:process.env.RAZORPAY_CLIENT_ID,client_secret:process.env.RAZORPAY_CLIENT_SECRET,grant_type:"authorization_code",redirect_uri:redirectUri,code,mode}),cache:"no-store"});const json=await res.json().catch(()=>({}));if(!res.ok||!json.access_token)throw new Error(json?.error_description||json?.error||"Razorpay OAuth token exchange failed");return json;}
export async function GET(req:Request){
 const url=new URL(req.url),state=url.searchParams.get("state")||"",code=url.searchParams.get("code")||"",error=url.searchParams.get("error");
 const savedState=req.headers.get("cookie")?.match(/(?:^|; )tentran_razorpay_oauth_state=([^;]*)/)?.[1]||"";
 if(error)return NextResponse.redirect(new URL(`/?connector_error=${encodeURIComponent(error)}`,url.origin));
 if(!state||!savedState||!same(state,decodeURIComponent(savedState))||!code)return new NextResponse("Invalid Razorpay OAuth callback",{status:403});
 if(!process.env.RAZORPAY_CLIENT_ID||!process.env.RAZORPAY_CLIENT_SECRET)return new NextResponse("Razorpay OAuth is not configured on the server",{status:503});
 try{const redirectUri=process.env.RAZORPAY_REDIRECT_URI||`${url.origin}/api/connectors/razorpay/oauth/callback`;const mode=process.env.RAZORPAY_OAUTH_MODE||"live";const token=await exchange(code,redirectUri,mode);await setConnectorAsync("razorpay",{accessToken:String(token.access_token),refreshToken:token.refresh_token?String(token.refresh_token):undefined,expiresAt:token.expires_in?Date.now()+Number(token.expires_in)*1000:undefined,tokenType:"Bearer",connectedAt:Date.now(),meta:"Razorpay · OAuth",providerData:{mode,oauth:true,publicToken:token.public_token?String(token.public_token):""}});const response=NextResponse.redirect(new URL("/?connected=razorpay",url.origin));response.cookies.set("tentran_razorpay_oauth_state","",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:0});return response;}catch(error){return NextResponse.redirect(new URL(`/?connector_error=${encodeURIComponent(error instanceof Error?error.message:"razorpay_oauth")}`,url.origin));}
}
