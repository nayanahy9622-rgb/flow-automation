import {NextRequest,NextResponse} from "next/server";
import {getGitHubAuth} from "@/lib/githubConnection";
import {connectors} from "@/lib/data";

export async function GET(req:NextRequest) {
  const githubUser=req.cookies.get("flowos_github_user")?.value;
  const githubAuth=githubUser?getGitHubAuth(githubUser):undefined;
  const data=connectors.map((c)=>{
    const isGitHub=c.id==="github";
    const connected=isGitHub&&Boolean(githubAuth);
    return {
      ...c,
      mode:isGitHub?"oauth":"unavailable",
      manualNote:null,
      fields:null,
      status:connected?"connected":c.status,
      meta:isGitHub?githubAuth?.meta??null:null,
    };
  });
  return NextResponse.json({data},{headers:{"cache-control":"no-store"}});
}

export async function POST(){
  return NextResponse.json({ok:false,error:"Use the provider-specific OAuth connection route."},{status:405,headers:{allow:"GET"}});
}
