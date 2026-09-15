import {randomBytes} from "crypto";
import {NextResponse} from "next/server";

export async function GET(req:Request){
 const clientId=process.env.RAZORPAY_CLIENT_ID;
 if(!clientId)return new NextResponse("Razorpay OAuth is not configured. Add RAZORPAY_CLIENT_ID on the server.",{status:503});
 const state=randomBytes(32).toString("base64url");
 const origin=new URL(req.url).origin;
 const redirectUri=process.env.RAZORPAY_REDIRECT_URI||`${origin}/api/connectors/razorpay/oauth/callback`;
 const authorize=new URL("https://auth.razorpay.com/authorize");
 authorize.searchParams.set("client_id",clientId);
 authorize.searchParams.set("response_type","code");
 authorize.searchParams.set("redirect_uri",redirectUri);
 authorize.searchParams.append("scope[]","read_only");
 authorize.searchParams.set("state",state);
 const response=NextResponse.redirect(authorize);
 response.cookies.set("tentran_razorpay_oauth_state",state,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:600});
 return response;
}
