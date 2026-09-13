import {NextRequest,NextResponse} from "next/server";
import {timingSafeEqual} from "crypto";
import {githubProvider} from "@/lib/githubProvider";
import {setGitHubAuth} from "@/lib/githubConnection";

const base=()=>process.env.APP_URL||"http://localhost:3000";
const same=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};

export async function GET(req:NextRequest){
 const u=new URL(req.url),code=u.searchParams.get("code"),state=u.searchParams.get("state"),saved=req.cookies.get("flowos_github_oauth_state")?.value;
 if(!code||!state||!saved||!same(state,saved))return new NextResponse("Invalid GitHub OAuth callback",{status:403});
 try{
  const auth=await githubProvider.exchange!(githubProvider.clientId!,githubProvider.clientSecret!,code,`${base()}/api/connectors/github/callback`);
  const meRes=await fetch("https://api.github.com/user",{headers:{accept:"application/vnd.github+json",authorization:`Bearer ${auth.accessToken}`,"X-GitHub-Api-Version":"2026-03-10"}});
  const me=await meRes.json();if(!meRes.ok||!me.id)throw new Error("Unable to identify GitHub user");
  setGitHubAuth(String(me.id),{...auth,githubUser:{id:me.id,login:me.login,name:me.name,avatarUrl:me.avatar_url},meta:`GitHub · @${me.login}`});
  const res=NextResponse.redirect(new URL("/?connected=github",base()));
  res.cookies.set("flowos_github_user",String(me.id),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*180});
  res.cookies.set("flowos_github_oauth_state","",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:0});
  return res;
 }catch{ return NextResponse.redirect(new URL("/?connector_error=github",base())); }
}
