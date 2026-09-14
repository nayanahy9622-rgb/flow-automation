"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {ArrowLeft, CheckCircle2, Database, ExternalLink, KeyRound, ShieldCheck, Trash2, Unplug} from "lucide-react";

type ConnectorMeta = {
  id: string;
  name: string;
  description: string;
  status: string;
  meta: string | null;
  mode: string;
  manualNote: string | null;
  fields: {env: string; label: string; placeholder: string; secret?: boolean}[] | null;
};

export default function ConnectorPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");
  const [conn, setConn] = useState<ConnectorMeta | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    if (id === "shopify") {
      router.replace("/connectors/shopify");
      return;
    }
    fetch("/api/connectors", {cache: "no-store"})
      .then((r) => r.json())
      .then((json) => {
        const item: ConnectorMeta | undefined = (json.data || []).find((c: ConnectorMeta) => c.id === id);
        if (item) setConn(item);
      })
      .catch(() => setError("Connector not found."));
  }, [id, router]);

  if (!conn) {
    return (
      <main style={page}>
        <div style={card}>
          <p style={{color: "#8b94a3", fontSize: 13}}>{id === "shopify" ? "Redirecting…" : error || "Loading connector…"}</p>
        </div>
      </main>
    );
  }

  async function startOAuth() {
    window.location.href = `/api/connectors/${id}/connect`;
  }

  async function saveKeys(e: React.FormEvent) {
    e.preventDefault();
    if (!conn?.fields) return;
    for (const f of conn.fields) {
      if (!values[f.env]?.trim()) {
        setError(`Enter the ${f.label}.`);
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/connectors/${id}/token`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Connection failed.");
      window.location.href = "/?connected=" + id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
      setLoading(false);
    }
  }

  async function disconnect() {
    await fetch(`/api/connectors/${id}/disconnect`, {method: "POST"});
    window.location.href = "/?disconnected=" + id;
  }

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/connector-data?id=${encodeURIComponent(id)}`, {cache: "no-store"});
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Data fetch failed.");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data fetch failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={page}>
      <div style={card}>
        <a href="/" style={back}><ArrowLeft size={15}/> Back to TenTran AI</a>
        <div style={{display: "flex", alignItems: "center", gap: 12}}>
          <div style={logo}>{conn.name.slice(0, 1)}</div>
          <div>
            <h1 style={{fontSize: 24, margin: 0, letterSpacing: "-.03em"}}>Connect {conn.name}</h1>
            <p style={{margin: "5px 0 0", fontSize: 12, color: "#77818f"}}>{conn.description}</p>
          </div>
        </div>

        <div style={{display: "inline-flex", alignItems: "center", gap: 7, marginTop: 18, padding: "6px 12px", borderRadius: 999, background: conn.status === "connected" ? "#0d2418" : "#161a21", border: "1px solid " + (conn.status === "connected" ? "#1e4d33" : "#232933"), color: conn.status === "connected" ? "#4ade80" : "#8b94a3", fontSize: 11}}>
          <span style={{width: 7, height: 7, borderRadius: "50%", background: conn.status === "connected" ? "#4ade80" : "#8b94a3"}}/>
          {conn.status}
          {conn.meta ? <span style={{color: "#5d6571"}}>— {conn.meta}</span> : null}
        </div>

        {conn.status === "connected" ? (
          <>
            <div style={{marginTop: 24, display: "flex", gap: 10}}>
              <button suppressHydrationWarning onClick={fetchData} disabled={loading} style={{...primary, flex: 1}}>
                <Database size={14}/> {loading ? "Fetching…" : "Fetch live data"}
              </button>
              <button suppressHydrationWarning onClick={disconnect} style={{...primary, flex: 1, background: "#1a1516", color: "#ff8b98", border: "1px solid #3a2226"}}>
                <Unplug size={14}/> Disconnect
              </button>
            </div>
            {data !== null ? (
              <pre style={{marginTop: 18, maxHeight: 320, overflow: "auto", background: "#080b0f", border: "1px solid #20252e", borderRadius: 10, padding: 16, fontSize: 11, color: "#aab3c1", whiteSpace: "pre-wrap", wordBreak: "break-word"}}>{JSON.stringify(data, null, 2)}</pre>
            ) : null}
          </>
        ) : conn.mode === "oauth" ? (
          <>
            <div style={infoBox}><ShieldCheck size={16}/><span>{conn.name} will open its official login and permission screen. TenTran AI never sees your {conn.name} password.</span></div>
            <button suppressHydrationWarning onClick={startOAuth} style={primary}><ExternalLink size={14}/> Sign in with {conn.name}</button>
            <p style={{margin: "16px 0 0", fontSize: 11, color: "#58616d", lineHeight: 1.6}}>The app still needs this connector&apos;s OAuth client ID/secret configured on the server (.env) before the redirect will work.</p>
          </>
        ) : conn.mode === "api-key" && conn.fields ? (
          <form onSubmit={saveKeys}>
            {conn.fields.map((f) => (
              <label key={f.env} style={{display: "block", fontSize: 11, color: "#8f98a5", marginTop: 18, marginBottom: 7}}>
                {f.label}
                <div style={{display: "flex", alignItems: "center", border: "1px solid #292f39", background: "#090d13", borderRadius: 9, overflow: "hidden", marginTop: 6}}>
                  <KeyRound size={15} color="#68717e" style={{marginLeft: 12}}/>
                  <input
                    suppressHydrationWarning
                    type={f.secret ? "password" : "text"}
                    value={values[f.env] || ""}
                    onChange={(e) => setValues({...values, [f.env]: e.target.value})}
                    placeholder={f.placeholder}
                    style={{width: "100%", boxSizing: "border-box", border: 0, outline: 0, background: "transparent", color: "#fff", padding: "11px 12px", fontSize: 12}}
                  />
                </div>
              </label>
            ))}
            <button suppressHydrationWarning disabled={loading} type="submit" style={{...primary, opacity: loading ? 0.7 : 1}}>
              <CheckCircle2 size={14}/> {loading ? "Testing credentials…" : "Test & connect"}
            </button>
            <div style={infoBox}><ShieldCheck size={16}/><span>TenTran AI validates these credentials live before saving, then stores them encrypted on the server. They are never sent to the browser after save.</span></div>
          </form>
        ) : (
          <div style={infoBox}><Database size={16}/><span>{conn.manualNote || "This connector requires provider-side onboarding or an approved partner/seller account before it can be connected automatically."}</span></div>
        )}

        {error && <div style={{marginTop: 16, border: "1px solid #5a2730", background: "#241216", color: "#ff9aa7", borderRadius: 9, padding: 12, fontSize: 12}}><Trash2 size={13} style={{marginRight: 6, verticalAlign: "middle"}}/>{error}</div>}
      </div>
    </main>
  );
}

const page: React.CSSProperties = {minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#07090d", color: "#eef1f6", fontFamily: "Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"};
const card: React.CSSProperties = {width: "min(680px,100%)", border: "1px solid #20252e", background: "#0c1016", borderRadius: 16, padding: 28, boxShadow: "0 30px 100px #0008"};
const back: React.CSSProperties = {display: "inline-flex", alignItems: "center", gap: 7, color: "#8e97a5", textDecoration: "none", fontSize: 12, marginBottom: 22};
const logo: React.CSSProperties = {width: 44, height: 44, borderRadius: 12, background: "#181d25", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 20};
const primary: React.CSSProperties = {marginTop: 18, width: "100%", border: 0, borderRadius: 9, background: "#f1f3f7", color: "#090b0e", padding: "11px 14px", fontWeight: 750, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer"};
const infoBox: React.CSSProperties = {marginTop: 20, display: "flex", gap: 9, alignItems: "flex-start", padding: 12, border: "1px solid #20262f", background: "#0a0e14", borderRadius: 9, color: "#737d8a", fontSize: 11, lineHeight: 1.5};