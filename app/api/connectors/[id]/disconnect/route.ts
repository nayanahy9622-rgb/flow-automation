import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/authStore";
import {removeConnectorAsync} from "@/lib/connectorStore";
import {getProvider} from "@/lib/oauth";

export async function POST(_req: Request, {params}: {params: Promise<{id: string}>}) {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ok:false,error:"unauthorized"},{status:401,headers:{"cache-control":"no-store"}});
  }
  const {id} = await params;
  if (!getProvider(id)) {
    return NextResponse.json({ok:false,error:"unknown_connector"},{status:404,headers:{"cache-control":"no-store"}});
  }
  try {
    await removeConnectorAsync(id);
    return NextResponse.json({ok:true,connectorId:id,connected:false},{headers:{"cache-control":"no-store"}});
  } catch {
    return NextResponse.json({ok:false,error:"disconnect_failed",message:"Could not remove the saved connector credentials."},{status:500,headers:{"cache-control":"no-store"}});
  }
}
