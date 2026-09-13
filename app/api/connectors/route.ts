import {NextRequest,NextResponse} from "next/server";
import {listAuth} from "@/lib/connectorStore";
import {connectors} from "@/lib/data";
import {getProvider} from "@/lib/oauth";
import {getGitHubAuth} from "@/lib/githubConnection";

export async function GET(req:NextRequest) {
  const auth=listAuth();
  const githubUser=req.cookies.get("flowos_github_user")?.value;
  const githubAuth=githubUser?getGitHubAuth(githubUser):undefined;
  const data=connectors.map((c)=>{
    const p=getProvider(c.id);
    const connected=c.id==="github"?Boolean(githubAuth):Boolean(auth[`connector:${c.id}`]);
    return {...c,mode:c.id==="github"?"oauth":p?.mode??"manual",manualNote:p?.manualNote??null,fields:p?.tokenFields?.map((f)=>({env:f.env,label:f.label,placeholder:f.placeholder,secret:f.secret}))??null,status:connected?"connected":c.status==="error"?"error":"available",meta:c.id==="github"?githubAuth?.meta??null:auth[`connector:${c.id}`]?.meta??null};
  });
  return NextResponse.json({data},{headers:{"cache-control":"no-store"}});
}

export async function POST(){return NextResponse.json({ok:false,error:"Use /api/connectors/:id/connect to start a real provider connection."},{status:405,headers:{allow:"GET"}});}
