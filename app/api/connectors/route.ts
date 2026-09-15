import {NextResponse} from "next/server";
import {connectors} from "@/lib/data";
import {getConnectorAsync} from "@/lib/connectorStore";
import {getProvider} from "@/lib/oauth";

export async function GET(){
 const data=await Promise.all(connectors.map(async c=>{const activeIds=["shopify","razorpay","flipkart","woocommerce","whatsapp","shiprocket","magento","delhivery","amazon","meta","tiktok","klaviyo","stripe","bigcommerce","wix","google-sheets","gmail","google-ads"];const isActive=activeIds.includes(c.id);const auth=isActive?await getConnectorAsync(c.id):undefined;const connected=Boolean(auth);const p=getProvider(c.id);const mode=p?.mode||"unavailable";return {...c,mode:isActive?mode:"unavailable",manualNote:p?.manualNote||null,fields:p?.tokenFields||null,status:connected?"connected":c.status,meta:auth?.meta||null};}));
 return NextResponse.json({data},{headers:{"cache-control":"no-store"}});
}
export async function POST(){return NextResponse.json({ok:false,error:"Use the provider-specific connection route."},{status:405,headers:{allow:"GET"}});}
