import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {randomBytes} from "crypto";
import {createSession,createUser,findUserByEmail,sessionCookie} from "@/lib/authStore";

export async function GET(req:Request){
  const url=new URL(req.url);const code=url.searchParams.get("code");const state=url.searchParams.get("state");
  const stored=(await cookies()).get("tentran_google_state")?.value;
  if(!code||!state||!stored||state!==stored)return NextResponse.redirect(new URL("/auth?error=google_state",url));
  try{
    const redirect=`${process.env.APP_URL||url.origin}/api/auth/google/callback`;
    const tokenRes=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,code,redirect_uri:redirect,grant_type:"authorization_code"})});
    const token=await tokenRes.json();if(!tokenRes.ok||!token.access_token)throw new Error("Google token exchange failed");
    const profileRes=await fetch("https://openidconnect.googleapis.com/v1/userinfo",{headers:{authorization:`Bearer ${token.access_token}`}});const profile=await profileRes.json();
    if(!profileRes.ok||!profile.email||profile.email_verified!==true)throw new Error("Google did not return a verified email");
    const user=await findUserByEmail(profile.email)||await createUser(profile.name||profile.email,profile.email,randomBytes(32).toString("base64url"));
    const response=NextResponse.redirect(new URL("/",url));response.cookies.set(sessionCookie(await createSession(user.id)));response.cookies.delete("tentran_google_state");return response;
  }catch(error){return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(error instanceof Error?error.message:"Google sign-in failed")}`,url));}
}
