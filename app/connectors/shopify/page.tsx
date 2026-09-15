"use client";
import {FormEvent, useState, useEffect} from "react";
import type {CSSProperties} from "react";
import {ArrowLeft,ExternalLink,ShieldCheck,Store} from "lucide-react";

const input: CSSProperties = {width:"100%",boxSizing:"border-box",border:0,outline:0,background:"transparent",color:"#fff",padding:"11px 12px",fontSize:13};
const inputWrap: CSSProperties = {display:"flex",alignItems:"center",border:"1px solid #292f39",background:"#090d13",borderRadius:9,overflow:"hidden"};
const primary: CSSProperties = {marginTop:16,width:"100%",border:0,borderRadius:9,background:"#f1f3f7",color:"#090b0e",padding:"13px 14px",fontWeight:750,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer",opacity:1};
const infoBox: CSSProperties = {marginTop:20,display:"flex",gap:9,alignItems:"flex-start",padding:14,border:"1px solid #20262f",background:"#0a0e14",borderRadius:9,color:"#737d8a",fontSize:11,lineHeight:1.6};

export default function ShopifyConnectPage(){
  const [shop,setShop]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get("shop")&&params.get("hmac")&&params.get("timestamp")){
      window.location.replace(`/api/connectors/shopify/install?${params.toString()}`);
    }
  },[]);

  function normalizedShop(value:string){
    let v=value.trim().toLowerCase();
    v=v.replace(/^https?:\/\//,"").replace(/\/.*$/,"");
    if(v.endsWith(".myshopify.com")) v=v.slice(0,-".myshopify.com".length);
    return v;
  }

  function submit(e:FormEvent){
    e.preventDefault();
    const name=normalizedShop(shop);
    if(!/^[a-z0-9][a-z0-9-]*$/.test(name)){
      setError("Enter a valid store name, for example: my-store");
      return;
    }
    setError("");
    setLoading(true);
    window.location.href=`/api/connectors/shopify/oauth?shop=${encodeURIComponent(name)}`;
  }

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#07090d",color:"#eef1f6",fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"}}>
   <div style={{width:"min(680px,100%)",border:"1px solid #20252e",background:"#0c1016",borderRadius:16,padding:28,boxShadow:"0 30px 100px #0008"}}>
    <a href="/" style={{display:"inline-flex",alignItems:"center",gap:7,color:"#8e97a5",textDecoration:"none",fontSize:12,marginBottom:22}}><ArrowLeft size={15}/> Back to TenTran AI</a>
    <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:44,height:44,borderRadius:12,background:"#181d25",display:"grid",placeItems:"center",fontWeight:800,fontSize:20}}>S</div><div><h1 style={{fontSize:24,margin:0,letterSpacing:"-.03em"}}>Connect Shopify</h1><p style={{margin:"6px 0 0",fontSize:12,color:"#77818f"}}>Sign in with Shopify and securely connect your store to TenTran AI.</p></div></div>

    <form onSubmit={submit}>
      <label style={{display:"block",fontSize:11,color:"#8f98a5",marginTop:24,marginBottom:7}}>Your store name</label>
      <div style={inputWrap}>
        <Store size={16} color="#68717e" style={{marginLeft:12}}/>
        <input suppressHydrationWarning value={shop} onChange={e=>setShop(e.target.value)} placeholder="my-store" autoFocus style={input}/>
        <span style={{color:"#5d6571",fontSize:12,paddingRight:12}}>.myshopify.com</span>
      </div>
      <button suppressHydrationWarning disabled={loading} type="submit" style={{...primary,opacity:loading?0.7:1}}>
        <ExternalLink size={14}/> {loading?"Redirecting…":"Continue with Shopify"}
      </button>
    </form>

    {error && <div style={{marginTop:14,border:"1px solid #5a2730",background:"#241216",color:"#ff9aa7",borderRadius:9,padding:12,fontSize:12}}>{error}</div>}
    <div style={infoBox}><ShieldCheck size={16}/><span>Shopify handles merchant sign-in and authorization. TenTran AI only asks for your store name and never sees your Shopify password.</span></div>
   </div>
  </main>;
}
