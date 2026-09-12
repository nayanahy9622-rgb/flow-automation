import {NextResponse} from "next/server";
import {getConnector} from "@/lib/connectorStore";
import {pullConnectorData} from "@/lib/oauth";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ok:false,error:"missing_connector_id"},{status:400});
  if (!getConnector(id)) return NextResponse.json({ok:false,error:"connector_not_connected"},{status:404,headers:{"cache-control":"no-store"}});
  try {
    const data = await pullConnectorData(id);
    return NextResponse.json({ok:true,connectorId:id,data},{headers:{"cache-control":"no-store"}});
  } catch (error) {
    return NextResponse.json({ok:false,error:error instanceof Error ? error.message : "connector_data_failed"},{status:502,headers:{"cache-control":"no-store"}});
  }
}
