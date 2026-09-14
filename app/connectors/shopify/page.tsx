"use client";
import {ArrowLeft,ExternalLink,ShieldCheck} from "lucide-react";

export default function ShopifyConnectPage(){
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#07090d",color:"#eef1f6",fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"}}>
  <div style={{width:"min(680px,100%)",border:"1px solid #20252e",background:"#0c1016",borderRadius:16,padding:28,boxShadow:"0 30px 100px #0008"}}>
   <a href="/" style={{display:"inline-flex",alignItems:"center",gap:7,color:"#8e97a5",textDecoration:"none",fontSize:12,marginBottom:22}}><ArrowLeft size={15}/> Back to TenTran AI</a>
   <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:44,height:44,borderRadius:12,background:"#181d25",display:"grid",placeItems:"center",fontWeight:800,fontSize:20}}>S</div><div><h1 style={{fontSize:24,margin:0,letterSpacing:"-.03em"}}>Connect Shopify</h1><p style={{margin:"6px 0 0",fontSize:12,color:"#77818f"}}>Sign in with Shopify and securely connect your store to TenTran AI.</p></div></div>
   <a href="/api/connectors/shopify/install" style={{marginTop:24,width:"100%",boxSizing:"border-box",border:0,borderRadius:9,background:"#f1f3f7",color:"#090b0e",padding:"13px 14px",fontWeight:750,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer",textDecoration:"none"}}><ExternalLink size={14}/> Continue with Shopify</a>
   <div style={{marginTop:20,display:"flex",gap:9,alignItems:"flex-start",padding:14,border:"1px solid #20262f",background:"#0a0e14",borderRadius:9,color:"#737d8a",fontSize:11,lineHeight:1.6}}><ShieldCheck size={16}/><span>Shopify handles merchant sign-in and authorization. TenTran AI does not ask you to type a store domain.</span></div>
  </div>
 </main>;
}
