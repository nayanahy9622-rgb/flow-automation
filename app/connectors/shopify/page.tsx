"use client";
import {FormEvent,useState} from "react";
import {ArrowLeft,ExternalLink,ShieldCheck} from "lucide-react";

export default function ShopifyConnectPage(){
 const [shop,setShop]=useState("");
 const [error,setError]=useState("");
 function connect(e:FormEvent){
  e.preventDefault(); setError("");
  const value=shop.trim().toLowerCase().replace(/^https?:\/\//,"").replace(/\/.*$/ ,"");
  const clean=value.replace(/\.myshopify\.com$/ ,"");
  if(!/^[a-z0-9][a-z0-9-]*$/.test(clean)){setError("Enter a valid Shopify store domain, for example your-store.myshopify.com.");return;}
  window.location.href=`/api/connectors/shopify/oauth?shop=${encodeURIComponent(clean)}`;
 }
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#07090d",color:"#eef1f6",fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"}}>
  <div style={{width:"min(680px,100%)",border:"1px solid #20252e",background:"#0c1016",borderRadius:16,padding:28,boxShadow:"0 30px 100px #0008"}}>
   <a href="/" style={{display:"inline-flex",alignItems:"center",gap:7,color:"#8e97a5",textDecoration:"none",fontSize:12,marginBottom:22}}><ArrowLeft size={15}/> Back to TenTran AI</a>
   <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:44,height:44,borderRadius:12,background:"#181d25",display:"grid",placeItems:"center",fontWeight:800,fontSize:20}}>S</div><div><h1 style={{fontSize:24,margin:0,letterSpacing:"-.03em"}}>Connect Shopify</h1><p style={{margin:"6px 0 0",fontSize:12,color:"#77818f"}}>Connect your Shopify store using Shopify&apos;s official authorization flow.</p></div></div>
   <form onSubmit={connect} style={{marginTop:24}}>
    <label style={{display:"block",fontSize:11,color:"#8f98a5"}}>Shopify store domain<input value={shop} onChange={e=>setShop(e.target.value)} placeholder="your-store.myshopify.com" autoComplete="url" style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:7,border:"1px solid #292f39",background:"#090d13",borderRadius:9,outline:0,color:"#fff",padding:"12px 13px",fontSize:13}}/></label>
    <button type="submit" style={{marginTop:16,width:"100%",border:0,borderRadius:9,background:"#f1f3f7",color:"#090b0e",padding:"11px 14px",fontWeight:750,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer"}}><ExternalLink size={14}/> Continue to Shopify</button>
   </form>
   {error&&<div style={{marginTop:14,border:"1px solid #5a2730",background:"#241216",color:"#ff9aa7",borderRadius:9,padding:12,fontSize:12}}>{error}</div>}
   <div style={{marginTop:20,display:"flex",gap:9,alignItems:"flex-start",padding:14,border:"1px solid #20262f",background:"#0a0e14",borderRadius:9,color:"#737d8a",fontSize:11,lineHeight:1.6}}><ShieldCheck size={16}/><span>Shopify handles the merchant approval screen. TenTran AI only receives the authorization result.</span></div>
   <p style={{margin:"16px 0 0",fontSize:11,color:"#58616d",lineHeight:1.6}}>The Shopify app must have the TenTran AI callback URL configured before this can complete.</p>
  </div>
 </main>;
}
