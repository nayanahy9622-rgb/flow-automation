import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {randomBytes} from "crypto";

export async function GET(){
  // Keep the auth entrypoint independent from the connector registry. The registry
  // is initialized at module load and can retain an old environment snapshot after
  // project variables are refreshed; OAuth credentials must be read per request.
  const clientId=process.env.GOOGLE_CLIENT_ID;
  const clientSecret=process.env.GOOGLE_CLIENT_SECRET;
  if(!clientId||!clientSecret)return NextResponse.json({ok:false,error:"Google sign-in is unavailable because the running server has not loaded its Google OAuth credentials. Restart the preview after configuring GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."},{status:503});
  const state=randomBytes(24).toString("hex");
  const redirect=`${process.env.APP_URL||"http://localhost:3000"}/api/auth/google/callback`;
  const url=`https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${encodeURIComponent("openid email profile")}&state=${state}&access_type=offline&prompt=select_account`;
  const response=NextResponse.redirect(url);
  (await cookies()).set("tentran_google_state",state,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:600});
  return response;
}
