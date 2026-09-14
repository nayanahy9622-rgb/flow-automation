import {ArrowLeft,Database,ShieldCheck} from "lucide-react";

export default function ShopifyConnectPage(){
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#07090d",color:"#eef1f6",fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"}}>
    <div style={{width:"min(680px,100%)",border:"1px solid #20252e",background:"#0c1016",borderRadius:16,padding:28,boxShadow:"0 30px 100px #0008"}}>
      <a href="/" style={{display:"inline-flex",alignItems:"center",gap:7,color:"#8e97a5",textDecoration:"none",fontSize:12,marginBottom:22}}><ArrowLeft size={15}/> Back to TenTran AI</a>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:12,background:"#181d25",display:"grid",placeItems:"center",fontWeight:800,fontSize:20}}>S</div>
        <div><h1 style={{fontSize:24,margin:0,letterSpacing:"-.03em"}}>Shopify</h1><p style={{margin:"6px 0 0",fontSize:12,color:"#77818f"}}>Real OAuth connection is being built before this connector is enabled.</p></div>
      </div>
      <div style={{marginTop:24,display:"flex",gap:9,alignItems:"flex-start",padding:14,border:"1px solid #20262f",background:"#0a0e14",borderRadius:9,color:"#737d8a",fontSize:12,lineHeight:1.6}}><ShieldCheck size={17}/><span>TenTran AI will never mark Shopify as connected until the official Shopify authorization flow, secure token storage and live data pull are all verified.</span></div>
      <div style={{marginTop:16,display:"flex",gap:9,alignItems:"flex-start",padding:14,border:"1px solid #20262f",background:"#0a0e14",borderRadius:9,color:"#737d8a",fontSize:12,lineHeight:1.6}}><Database size={17}/><span>GitHub is currently the only live connector enabled. Shopify will appear here when its production-ready connector is complete.</span></div>
    </div>
  </main>;
}
