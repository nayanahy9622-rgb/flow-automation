"use client";

import {FormEvent, useState} from "react";
import {ArrowLeft, CheckCircle2, ExternalLink, KeyRound, LockKeyhole, ShieldCheck, Store} from "lucide-react";

export default function ShopifyConnectPage() {
  const [shop, setShop] = useState("");
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<"oauth" | "token">("oauth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function normalizedShop(value: string) {
    let v = value.trim().toLowerCase();
    v = v.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (v.endsWith(".myshopify.com")) v = v.slice(0, -".myshopify.com".length);
    return v;
  }

  function startOAuth(e: FormEvent) {
    e.preventDefault();
    const name = normalizedShop(shop);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      setError("Enter a valid Shopify store, for example your-store.myshopify.com.");
      return;
    }
    setError("");
    window.location.href = `/api/connectors/shopify/oauth?shop=${encodeURIComponent(name)}`;
  }

  async function connectToken(e: FormEvent) {
    e.preventDefault();
    const name = normalizedShop(shop);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      setError("Enter a valid Shopify store, for example your-store.myshopify.com.");
      return;
    }
    if (!token.trim()) {
      setError("Paste the Admin API access token.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/connectors/shopify/token", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({shop: name, token: token.trim()}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Shopify connection failed.");
      window.location.href = "/?connected=shopify";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Shopify connection failed.");
      setLoading(false);
    }
  }

  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#07090d",color:"#eef1f6",fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"}}>
      <div style={{width:"min(680px,100%)",border:"1px solid #20252e",background:"#0c1016",borderRadius:16,padding:28,boxShadow:"0 30px 100px #0008"}}>
        <a href="/" style={{display:"inline-flex",alignItems:"center",gap:7,color:"#8e97a5",textDecoration:"none",fontSize:12,marginBottom:22}}><ArrowLeft size={15}/> Back to FlowOS</a>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:12,background:"#181d25",display:"grid",placeItems:"center",fontWeight:800,fontSize:20}}>S</div>
          <div><h1 style={{fontSize:24,margin:0,letterSpacing:"-.03em"}}>Connect Shopify</h1><p style={{margin:"6px 0 0",fontSize:12,color:"#77818f"}}>Authenticate your store and give FlowOS real API access.</p></div>
        </div>

        <div style={{display:"flex",gap:6,background:"#090d13",border:"1px solid #20252e",padding:4,borderRadius:10,marginTop:26}}>
          <button onClick={()=>setMode("oauth")} style={tab(mode==="oauth")}>Connect with Shopify</button>
          <button onClick={()=>setMode("token")} style={tab(mode==="token")}>Paste API token</button>
        </div>

        {mode === "oauth" ? (
          <form onSubmit={startOAuth}>
            <label style={label}>Shopify store domain</label>
            <div style={{display:"flex",alignItems:"center",border:"1px solid #292f39",background:"#090d13",borderRadius:9,overflow:"hidden"}}>
              <Store size={16} color="#68717e" style={{marginLeft:12}}/>
              <input value={shop} onChange={e=>setShop(e.target.value)} placeholder="your-store.myshopify.com" style={input(true)}/>
            </div>
            <button type="submit" style={primary}>Continue to Shopify <ExternalLink size={14}/></button>
            <div style={infoBox}><ShieldCheck size={16}/><span>Shopify will open its own login and permission screen. FlowOS never asks for your Shopify password.</span></div>
          </form>
        ) : (
          <form onSubmit={connectToken}>
            <label style={label}>Shopify store domain</label>
            <input value={shop} onChange={e=>setShop(e.target.value)} placeholder="your-store.myshopify.com" style={input(false)}/>
            <label style={{...label,marginTop:16}}>Admin API access token</label>
            <div style={{display:"flex",alignItems:"center",border:"1px solid #292f39",background:"#090d13",borderRadius:9,overflow:"hidden"}}>
              <KeyRound size={16} color="#68717e" style={{marginLeft:12}}/>
              <input value={token} onChange={e=>setToken(e.target.value)} placeholder="shpat_..." type="password" style={input(true)}/>
            </div>
            <button disabled={loading} type="submit" style={{...primary,opacity:loading?.7:1}}>{loading?"Testing connection…":"Test & connect"} <CheckCircle2 size={14}/></button>
            <div style={infoBox}><LockKeyhole size={16}/><span>FlowOS validates the token against Shopify before marking the connector as connected, then stores it encrypted on the server.</span></div>
          </form>
        )}

        {error && <div style={{marginTop:16,border:"1px solid #5a2730",background:"#241216",color:"#ff9aa7",borderRadius:9,padding:12,fontSize:12}}>{error}</div>}
        <p style={{margin:"20px 0 0",fontSize:11,color:"#58616d",lineHeight:1.6}}>The OAuth app itself still needs FlowOS's Shopify app credentials configured on the server. Those are developer credentials, not credentials you should paste here.</p>
      </div>
    </main>
  );
}

const label: React.CSSProperties = {display:"block",fontSize:11,color:"#8f98a5",marginTop:24,marginBottom:7};
const input = (inside:boolean): React.CSSProperties => ({width:"100%",boxSizing:"border-box",border:0,outline:0,background:"transparent",color:"#fff",padding:inside?"11px 12px":"11px 12px",fontSize:12});
const primary: React.CSSProperties = {marginTop:18,width:"100%",border:0,borderRadius:9,background:"#f1f3f7",color:"#090b0e",padding:"11px 14px",fontWeight:750,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer"};
const infoBox: React.CSSProperties = {marginTop:16,display:"flex",gap:9,alignItems:"flex-start",padding:12,border:"1px solid #20262f",background:"#0a0e14",borderRadius:9,color:"#737d8a",fontSize:11,lineHeight:1.5};
const tab = (active:boolean): React.CSSProperties => ({flex:1,border:0,borderRadius:7,padding:"9px 10px",background:active?"#1a1f28":"transparent",color:active?"#fff":"#747e8b",fontSize:11,cursor:"pointer"});
