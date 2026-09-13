import {NextResponse} from "next/server";
import {randomBytes} from "crypto";

const callback=()=>`${process.env.APP_URL||"http://localhost:3000"}/api/connectors/github/callback`;
const b64=(b:Buffer)=>b.toString("base64url");

export async function GET(){
  const clientId=process.env.GITHUB_CLIENT_ID;
  if(!clientId)return NextResponse.json({ok:false,error:"GITHUB_CLIENT_ID_missing"},{status:500});
  const state=b64(randomBytes(32));
  const url=new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id",clientId);
  url.searchParams.set("redirect_uri",callback());
  url.searchParams.set("state",state);
  url.searchParams.set("allow_signup","true");
  url.searchParams.set("prompt","select_account");
  const res=NextResponse.redirect(url);
  res.cookies.set("flowos_github_oauth_state",state,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:600});
  return res;
}
