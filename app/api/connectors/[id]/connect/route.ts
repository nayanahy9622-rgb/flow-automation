import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {getProvider, missingCredentials, providerState, connectorCallback} from "@/lib/oauth";
import {getCurrentUser} from "@/lib/authStore";

export async function GET(req:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!(await getCurrentUser()))return NextResponse.json({ok:false,error:"unauthorized"},{status:401});
  const provider=getProvider(id);
  if(!provider)return NextResponse.json({ok:false,error:"unknown_connector"},{status:404});
  const missing=missingCredentials(provider);
  if(missing.length)return NextResponse.json({ok:false,error:"provider_not_configured",message:`Configure ${missing.join(", ")} before connecting.`},{status:503});
  if(provider.mode!=="oauth"||!provider.authorize)return NextResponse.json({ok:false,error:"oauth_not_supported",message:`${provider.name} uses API credentials.`},{status:405});
  const state=providerState();
  const redirect=NextResponse.redirect(provider.authorize(provider.clientId!,connectorCallback(id),state));
  const store=await cookies();
  store.set("flowos_oauth_state",state,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:600});
  return redirect;
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}) {
  return GET(req,{params});
}
