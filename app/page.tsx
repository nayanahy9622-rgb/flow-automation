"use client";

import {useEffect,useMemo,useState} from "react";
import {Activity,BadgeIndianRupee,BarChart3,Bot,Box,ChevronRight,Clock3,Database,FileDown,Gauge,LayoutDashboard,Link2,Mail,Megaphone,Package,Plug,RefreshCw,Search,Settings,ShieldCheck,ShoppingBag,Sparkles,Users,Wallet,Webhook,Workflow,X,Zap} from "lucide-react";
import {automations,connectors} from "@/lib/data";

type Source={id:string;name:string;category:string;status:string;description:string;meta?:string|null};
type LiveBundle={connectorId:string;data:any};

const nav=[
  ["OVERVIEW",[["Dashboard",LayoutDashboard]]],
  ["OPERATE",[["Sales",ShoppingBag],["Customers",Users],["Inventory",Package],["Finance",Wallet],["Marketing",Megaphone],["Data",Database]]],
  ["AUTOMATE",[["Automations",Workflow],["AI Agent",Bot],["Activity",Activity]]],
  ["CONNECT",[["Connectors",Plug],["API & Webhooks",Webhook]]],
  ["SYSTEM",[["Settings",Settings]]],
] as const;

const recipes=[
  {title:"Recover abandoned carts",trigger:"Checkout abandoned",when:"Customer has an open cart and no order",act:"Send recovery message → wait → retry",impact:"Revenue recovery"},
  {title:"Win back high-value customers",trigger:"No purchase for 60 days",when:"Customer is high-LTV or recently engaged",act:"Personalized offer → message → measure",impact:"Retention"},
  {title:"Protect low stock",trigger:"Stock below threshold",when:"Sell-through is high or replenishment is delayed",act:"Alert → reserve → notify team",impact:"Availability"},
  {title:"Recover failed payments",trigger:"Payment failed",when:"Order is unpaid and recoverable",act:"Retry → remind → escalate",impact:"Cash recovery"},
  {title:"Launch new collection",trigger:"Collection published",when:"New products are ready to promote",act:"Segment → publish campaign → measure",impact:"Demand"},
];

export default function App(){
  const [active,setActive]=useState("Dashboard");
  const [query,setQuery]=useState("");
  const [showCreate,setShowCreate]=useState(false);
  const [sources,setSources]=useState<Source[]>(connectors as Source[]);
  const [live,setLive]=useState<Record<string,LiveBundle>>({});
  const [syncing,setSyncing]=useState(false);

  useEffect(()=>{refreshSources()},[]);
  useEffect(()=>{if(active==="Dashboard"||active==="Sales"||active==="Data") refreshLive(active)},[active]);

  async function refreshSources(){
    try{const r=await fetch("/api/connectors",{cache:"no-store"});const j=await r.json();if(Array.isArray(j.data))setSources(j.data)}catch{}
  }

  async function refreshLive(view:string){
    if(view!=="Dashboard"&&view!=="Sales"&&view!=="Data")return;
    setSyncing(true);
    try{
      const connected=sources.filter(s=>s.status==="connected").slice(0,10);
      const results=await Promise.allSettled(connected.map(async s=>{
        const r=await fetch(`/api/connector-data?id=${encodeURIComponent(s.id)}`,{cache:"no-store"});
        const j=await r.json();
        if(!r.ok||!j.ok)throw new Error(j.error||"live_pull_failed");
        return j as LiveBundle;
      }));
      const next:{[key:string]:LiveBundle}={};
      results.forEach((r,i)=>{if(r.status==="fulfilled")next[connected[i].id]=r.value});
      setLive(next);
    }finally{setSyncing(false)}
  }

  const filteredSources=useMemo(()=>sources.filter(s=>!query||`${s.name} ${s.category} ${s.description}`.toLowerCase().includes(query.toLowerCase())),[sources,query]);
  const connectedCount=sources.filter(s=>s.status==="connected").length;

  return <div className="app">
    <aside>
      <div className="logo"><span>◆</span> Tentran AI</div>
      <div className="workspace"><div>COMMERCE CONTROL PLANE</div><b>➞</b></div>
      {nav.map(([group,items])=><div key={group}>
        <div className="label">{group}</div>
        {items.map(([name,I])=><button key={name} suppressHydrationWarning className={`nav ${active===name?"sel":""}`} onClick={()=>setActive(name)}><I size={17}/><span>{name}</span>{name==="Data"&&connectedCount>0?<em>{connectedCount}</em>:null}</button>)}
      </div>)}
      <div className="bottom">
        <div className="health"><i/><span>{connectedCount>0?`${connectedCount} live source${connectedCount===1?"":"s"}`:"No live sources yet"}</span></div>
        <div className="profile"><div className="avatar">FO</div><div><b>Workspace owner</b><small>Operations</small></div><Settings size={16}/></div>
      </div>
    </aside>

    <main>
      <header>
        <div><h1>{active}</h1><p>{subtitle(active)}</p></div>
        <div className="head">
          <div className="search"><Search size={15}/><input suppressHydrationWarning placeholder="Search sources, orders, customers…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
          <button className="icon" suppressHydrationWarning><BellDot/><span/></button>
          <button className="primary" suppressHydrationWarning onClick={()=>setShowCreate(true)}><Sparkles size={15}/> Build automation</button>
        </div>
      </header>

      {active==="Dashboard"&&<Dashboard live={live} sources={sources} syncing={syncing} refresh={()=>refreshLive("Dashboard")} go={setActive}/>} 
      {active==="Sales"&&<Sales live={live} sources={sources} syncing={syncing} refresh={()=>refreshLive("Sales")} go={setActive}/>} 
      {active==="Data"&&<DataCenter live={live} sources={sources} filtered={filteredSources} syncing={syncing} refresh={()=>refreshLive("Data")} go={setActive}/>} 
      {active==="Automations"&&<AutomationPage open={()=>setShowCreate(true)}/>} 
      {active==="AI Agent"&&<AgentPage/>}
      {active==="Activity"&&<ActivityPage/>}
      {active==="Connectors"&&<ConnectorPage items={filteredSources} refresh={refreshSources}/>} 
      {active==="API & Webhooks"&&<WebhookPage/>}
      {active==="Customers"&&<SimpleModule title="Customers" icon={Users} copy="Customer profiles, segments, lifecycle states and retention signals become automation context." cards={["Profiles","Segments","Lifecycle","LTV & retention"]}/>} 
      {active==="Inventory"&&<SimpleModule title="Inventory" icon={Package} copy="Turn stock, availability and replenishment signals into operational actions." cards={["Stock health","Reorder risk","Availability","Supplier actions"]}/>} 
      {active==="Finance"&&<SimpleModule title="Finance" icon={Wallet} copy="Unify payments, refunds, reconciliation and cash-recovery workflows." cards={["Payments","Refunds","Reconciliation","Recovery"]}/>} 
      {active==="Marketing"&&<SimpleModule title="Marketing" icon={Megaphone} copy="Coordinate acquisition, campaigns, audiences and performance across connected channels." cards={["Campaigns","Audiences","Attribution","Optimization"]}/>} 
      {active==="Settings"&&<SettingsPage/>}

      {showCreate&&<CreateModal close={()=>setShowCreate(false)}/>} 
    </main>
  </div>
}

function subtitle(active:string){const m:Record<string,string>={Dashboard:"See what is happening, what matters next, and what Tentran AI can execute.",Sales:"Revenue and order operations across every connected commerce source.",Customers:"Know who bought, who is at risk, and who should be contacted next.",Inventory:"Availability, sell-through and replenishment signals.",Finance:"Money in, money out, recovery and reconciliation.",Marketing:"Campaigns, audiences, acquisition and performance.",Data:"One data plane for every connected source and canonical business object.",Automations:"Reusable trigger → context → decision → action workflows.","AI Agent":"An execution layer that observes signals, reasons with context and acts within policy.",Activity:"A single log of what Tentran AI is doing and why.",Connectors:"Connect the systems that create and consume your commerce data.","API & Webhooks":"Inbound events, outbound actions, verification and automation triggers.",Settings:"Workspace defaults, data policy and operating controls."};return m[active]||"Tentran AI commerce operations"}

function Dashboard({live,sources,syncing,refresh,go}:{live:Record<string,LiveBundle>;sources:Source[];syncing:boolean;refresh:()=>void;go:(v:string)=>void}){
  const shop=live.shopify?.data?.data?.shop||live.shopify?.data?.shop;
  const orders=live.shopify?.data?.data?.orders?.nodes||live.shopify?.data?.orders?.nodes||[];
  const revenue=orders.reduce((s:number,o:any)=>s+Number(o.totalPriceSet?.shopMoney?.amount||0),0);
  const aov=orders.length?revenue/orders.length:0;
  return <>
    <div className="topbar"><div><div className="eyebrow">OPERATING PICTURE</div><h2>{shop?.name||"Your commerce system"}</h2><p>{shop?.myshopifyDomain||"Connect a commerce source to replace placeholders with live metrics."}</p></div><button className="secondary" onClick={refresh} disabled={syncing} suppressHydrationWarning><RefreshCw size={13}/>{syncing?" Syncing":" Sync now"}</button></div>
    <div className="stats">
      <Metric label="Revenue sampled" value={revenue?money(revenue,orders[0]?.totalPriceSet?.shopMoney?.currencyCode):"--"} note={orders.length?`${orders.length} recent orders`:"Connect Shopify or another source"}/>
      <Metric label="Orders sampled" value={orders.length?orders.length.toLocaleString():"—"} note="Current live pull"/>
      <Metric label="Average order value" value={aov?money(aov,orders[0]?.totalPriceSet?.shopMoney?.currencyCode):"—"} note={orders.length?"Derived from pulled orders":"Available after sync"}/>
      <Metric label="Live sources" value={sources.filter(s=>s.status==="connected").length} note="Connected providers"/>
    </div>
    <div className="grid2">
      <section className="panel heroPanel"><div className="panelHead"><div><h3>What Tentran AI should do next</h3><p>Recommendations are workflow templates until the underlying data supports a specific opportunity.</p></div><Bot size={18}/></div>{recipes.slice(0,3).map(r=><Opportunity key={r.title} recipe={r} onClick={()=>go("Automations")}/>)}</section>
      <section className="panel"><div className="panelHead"><div><h3>Data → decision → action</h3><p>The core automation loop.</p></div><Gauge size={18}/></div><Pipeline/></section>
    </div>
    <section className="panel"><div className="panelHead"><div><h3>Connected data fabric</h3><p>Every connected source can feed canonical records, analytics and automation context.</p></div><button className="link" suppressHydrationWarning onClick={()=>go("Data")}>Open Data <ChevronRight size={13}/></button></div><div className="sourceStrip">{sources.filter(s=>s.status==="connected").map(s=><SourcePill key={s.id} source={s} live={live[s.id]}/>) }{sources.filter(s=>s.status==="connected").length===0&&<EmptyState title="No live sources yet" copy="Connect your store, payments, marketing and messaging systems. Their data will appear here." onClick={()=>go("Connectors")}/>}</div></section>
  </>
}

function Sales({live,sources,syncing,refresh,go}:{live:Record<string,LiveBundle>;sources:Source[];syncing:boolean;refresh:()=>void;go:(v:string)=>void}){
  const orders=live.shopify?.data?.data?.orders?.nodes||live.shopify?.data?.orders?.nodes||[];
  const products=live.shopify?.data?.data?.products?.nodes||live.shopify?.data?.products?.nodes||[];
  const revenue=orders.reduce((s:number,o:any)=>s+Number(o.totalPriceSet?.shopMoney?.amount||0),0);
  const currency=orders[0]?.totalPriceSet?.shopMoney?.currencyCode;
  const paid=orders.filter((o:any)=>String(o.displayFinancialStatus||"").toLowerCase().includes("paid")).length;
  const fulfilled=orders.filter((o:any)=>String(o.displayFulfillmentStatus||"").toLowerCase().includes("fulfilled")).length;
  return <>
    <div className="topbar"><div><div className="eyebrow">SALES CONTROL</div><h2>{orders.length?"Live order performance":"Sales comes from connected commerce data"}</h2><p>{orders.length?`${orders.length} recent orders pulled from live sources.`:"No live order dataset is available yet."}</p></div><button className="secondary" onClick={refresh} disabled={syncing} suppressHydrationWarning><RefreshCw size={13}/>{syncing?" Syncing":" Refresh"}</button></div>
    <div className="stats"><Metric label="Revenue sampled" value={revenue?money(revenue,currency):"—"} note="From current order pull"/><Metric label="Orders" value={orders.length||"—"} note="Recent order records"/><Metric label="Paid" value={orders.length?paid:"—"} note="Financial status"/><Metric label="Fulfilled" value={orders.length?fulfilled:"—"} note="Fulfillment status"/></div>
    <div className="grid2">
      <section className="panel"><div className="panelHead"><div><h3>Orders</h3><p>Canonical sales view built from the connected commerce source.</p></div><ShoppingBag size={18}/></div>{orders.length?<table><thead><tr><th>ORDER</th><th>STATUS</th><th>FULFILLMENT</th><th>VALUE</th></tr></thead><tbody>{orders.slice(0,20).map((o:any)=><tr key={o.id}><td><b>{o.name||o.id}</b></td><td>{o.displayFinancialStatus||"—"}</td><td>{o.displayFulfillmentStatus||"—"}</td><td>{o.totalPriceSet?.shopMoney?money(o.totalPriceSet.shopMoney.amount,o.totalPriceSet.shopMoney.currencyCode):"—"}</td></tr>)}</tbody></table>:<EmptyState title="Connect commerce data" copy="Sales will automatically become a live view once a commerce connector has orders to pull." onClick={()=>go("Connectors")}/>}</section>
      <section className="panel"><div className="panelHead"><div><h3>Sales automations</h3><p>Recommended plays linked to revenue outcomes.</p></div><Zap size={18}/></div>{recipes.filter(r=>["Sales","Retention","Demand","Cash recovery"].includes(r.impact)||true).slice(0,4).map(r=><Opportunity key={r.title} recipe={r} onClick={()=>go("Automations")}/>)}</section>
    </div>
    <section className="panel"><div className="panelHead"><div><h3>Product signal</h3><p>{products.length?`${products.length} products sampled from the live catalog.`:"Catalog appears once a commerce source is connected."}</p></div><Package size={18}/></div>{products.length?<div className="miniGrid">{products.slice(0,8).map((p:any)=><div className="miniCard" key={p.id}><b>{p.title}</b><span>{p.status||"Catalog item"}</span><small>{p.totalInventory!=null?`${p.totalInventory} units`:"Inventory not exposed in this source pull"}</small></div>)}</div>:<EmptyState title="No catalog sample" copy="Product data will feed pricing, merchandising and inventory automations." onClick={()=>go("Data")}/>}</section>
  </>
}

function DataCenter({live,sources,filtered,syncing,refresh,go}:{live:Record<string,LiveBundle>;sources:Source[];filtered:Source[];syncing:boolean;refresh:()=>void;go:(v:string)=>void}){
  const connected=sources.filter(s=>s.status==="connected");
  return <>
    <div className="topbar"><div><div className="eyebrow">DATA FABRIC</div><h2>One place for the business truth</h2><p>Pull live source data, normalize it into canonical objects, then expose it to analytics and automations.</p></div><button className="secondary" onClick={refresh} disabled={syncing} suppressHydrationWarning><RefreshCw size={13}/>{syncing?" Pulling…":" Pull live data"}</button></div>
    <section className="panel"><div className="panelHead"><div><h3>Live sources</h3><p>Frontend reads through the existing connector APIs; connector implementation remains isolated.</p></div><span className="status connected">{connected.length} connected</span></div><div className="sourceGrid">{filtered.map(s=><SourceCard key={s.id} source={s} live={live[s.id]}/>)}</div></section>
    <div className="grid2"><section className="panel"><div className="panelHead"><div><h3>Canonical data model</h3><p>Where pulled data should land before automation logic uses it.</p></div><Database size={18}/></div><div className="modelGrid">{["orders","order_items","customers","products","variants","inventory","payments","refunds","shipments","campaigns","ad_spend","messages","events","automation_runs"].map(x=><div className="modelItem" key={x}><span>{x}</span><small>canonical record</small></div>)}</div></section><section className="panel"><div className="panelHead"><div><h3>Storage layers</h3><p>Separation keeps credentials, operational state and analytics responsibilities clear.</p></div><ShieldCheck size={18}/></div><StorageLayers/></section></div>
    <section className="panel"><div className="panelHead"><div><h3>How data moves</h3><p>Designed so every connector follows the same system pattern.</p></div><ArrowFlow/></div><Pipeline full/></section>
  </>
}

function StorageLayers(){return <div className="storage"><div><b>1. Secure credentials</b><span>OAuth / API secrets only</span></div><div><b>2. Raw event log</b><span>Signed events + idempotency keys</span></div><div><b>3. Operational database</b><span>Canonical orders, customers, products, payments</span></div><div><b>4. Analytics projections</b><span>Aggregates, cohorts, KPIs, models</span></div><div><b>5. Automation state</b><span>Runs, outcomes, approvals, retries</span></div></div>}

function Pipeline({full=false}){const steps=full?["Provider API / webhook","Ingest + verify","Normalize","Canonical DB","Analytics + AI","Automation engine","Provider action","Outcome + feedback"]:["Collect","Normalize","Decide","Act","Measure"];return <div className="pipeline">{steps.map((s,i)=><div className="pipeStep" key={s}><span>{String(i+1).padStart(2,"0")}</span><b>{s}</b>{i<steps.length-1&&<ChevronRight size={14}/>}</div>)}</div>}
function ArrowFlow(){return <div className="flowMark"><span>INPUT</span><ChevronRight size={13}/><span>STATE</span><ChevronRight size={13}/><span>ACTION</span></div>}

function AutomationPage({open}:{open:()=>void}){return <>
  <div className="topbar"><div><div className="eyebrow">AUTOMATION ENGINE</div><h2>From event to outcome</h2><p>Keep the mental model simple: trigger → context → decision → action → measurement.</p></div><button className="primary" suppressHydrationWarning onClick={open}><Workflow size={14}/> New automation</button></div>
  <section className="recipeGrid">{recipes.map(r=><div className="recipe" key={r.title}><div className="recipeTop"><span className="cat">{r.impact}</span><Sparkles size={16}/></div><h3>{r.title}</h3><div className="recipeLine"><span>WHEN</span><b>{r.trigger}</b></div><div className="recipeLine"><span>CHECK</span><b>{r.when}</b></div><div className="recipeLine"><span>ACT</span><b>{r.act}</b></div><button className="ghostWide" suppressHydrationWarning onClick={open}>Use this workflow <ChevronRight size={13}/></button></div>)}</section>
  <section className="panel"><div className="panelHead"><div><h3>Automation run contract</h3><p>Every run should be observable, retryable and attributable to a source event.</p></div><Activity size={18}/></div><div className="contractGrid"><div><b>Trigger</b><span>Event or schedule</span></div><div><b>Context</b><span>Customer + order + product + campaign state</span></div><div><b>Policy</b><span>Rules, limits, approvals and safety</span></div><div><b>Decision</b><span>Rules or AI recommendation</span></div><div><b>Action</b><span>Provider API call</span></div><div><b>Outcome</b><span>Response, metric and audit record</span></div></div></section>
</>}

function AgentPage(){return <>
  <div className="topbar"><div><div className="eyebrow">AI EXECUTION</div><h2>AI Agent, with guardrails</h2><p>Use AI for interpretation and decisions; deterministic policies control what the system is allowed to execute.</p></div><div className="secure"><ShieldCheck size={17}/> Policy controlled</div></div>
  <div className="grid2"><section className="panel"><div className="panelHead"><div><h3>Observe</h3><p>Signals arriving from connected systems.</p></div><Activity size={18}/></div>{["Order event","Customer lifecycle change","Inventory threshold","Campaign performance change"].map((x,i)=><div className="agentRow" key={x}><span>{String(i+1).padStart(2,"0")}</span><b>{x}</b><small>Available to agent context</small></div>)}</section><section className="panel"><div className="panelHead"><div><h3>Decide</h3><p>Reason over canonical context and business policy.</p></div><Bot size={18}/></div>{["Score opportunity","Select next best action","Check policy limits","Request approval when needed"].map((x,i)=><div className="agentRow" key={x}><span>→</span><b>{x}</b><small>{i<3?"Can be automated":"Human-in-the-loop"}</small></div>)}</section></div>
</>}

function ActivityPage(){return <>
  <div className="topbar"><div><div className="eyebrow">AUDIT + OPERATIONS</div><h2>Activity</h2><p>Use this surface for run history, retries, failures and outcomes. It should remain event-driven rather than decorative.</p></div><Clock3 size={18}/></div>
  <section className="panel"><table><thead><tr><th>STAGE</th><th>WHAT TO SHOW</th><th>WHY IT MATTERS</th></tr></thead><tbody>{[["INGEST","source event + event id","proves what triggered the run"],["DECISION","conditions + AI reasoning summary","proves why a path was selected"],["ACTION","provider + operation","shows what was actually executed"],["OUTCOME","provider response + business metric","closes the loop"],["RETRY","attempt + next retry","makes failures recoverable"]].map(r=><tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></section>
</>}

function ConnectorPage({items,refresh}:{items:Source[];refresh:()=>void}){return <>
  <div className="topbar"><div><div className="eyebrow">SYSTEM CONNECTIONS</div><h2>Connect once. Reuse everywhere.</h2><p>Connector ownership stays in the connector layer. This screen only launches, reflects status and exposes live-source health.</p></div><button className="secondary" suppressHydrationWarning onClick={refresh}><RefreshCw size={13}/> Refresh status</button></div>
  <div className="connectorGrid">{items.map(c=><div className="connectorCard" key={c.id}><div className="connectorIcon">{c.name.slice(0,1)}</div><div className="connectorBody"><div className="connectorTitle"><h3>{c.name}</h3><span className={`status ${c.status}`}>{c.status}</span></div><p>{c.description}</p>{c.meta?<small>{c.meta}</small>:null}<div className="connectorFoot"><button className="ghost" suppressHydrationWarning onClick={()=>window.location.href=`/connectors/${c.id}`}>{c.status==="connected"?"Reconfigure":"Connect"} <Link2 size={12}/></button><button className="tiny" suppressHydrationWarning onClick={()=>window.location.href=`/connectors/${c.id}`}>Open</button></div></div></div>)}</div>
</>}

function WebhookPage(){return <>
  <div className="topbar"><div><div className="eyebrow">EVENT GATEWAY</div><h2>API & Webhooks</h2><p>Inbound events should be verified, deduplicated and turned into automation triggers. Outbound actions should be observable.</p></div><div className="secure"><ShieldCheck size={17}/> Signed events</div></div>
  <div className="grid2"><section className="panel"><div className="panelHead"><div><h3>Inbound event contract</h3><p>Minimal event envelope Tentran AI should persist.</p></div><Webhook size={18}/></div><div className="codeBlock">{`event_id\nprovider\ntopic\nreceived_at\nsignature_status\nentity_type\nentity_id\npayload_ref\nprocessing_status`}</div></section><section className="panel"><div className="panelHead"><div><h3>Processing rules</h3><p>Recommended production semantics.</p></div><ShieldCheck size={18}/></div>{["Verify signature","Check idempotency","Persist event","Normalize entity","Enqueue automation","Acknowledge quickly"].map(x=><div className="checkRow" key={x}><ShieldCheck size={14}/><span>{x}</span></div>)}</section></div>
</>}

function SimpleModule({title,icon:Icon,copy,cards}:{title:string;icon:any;copy:string;cards:string[]}){return <>
  <section className="moduleHero"><div className="moduleIcon"><Icon size={24}/></div><div><div className="eyebrow">OPERATING MODULE</div><h2>{title}</h2><p>{copy}</p></div></section>
  <div className="moduleCards">{cards.map(c=><div className="card" key={c}><CheckCircle2Icon/><h3>{c}</h3><p>Canonical records + analytics + automation actions.</p></div>)}</div>
</>}

function SettingsPage(){return <>
  <section className="moduleHero"><div className="moduleIcon"><Settings size={24}/></div><div><div className="eyebrow">WORKSPACE</div><h2>Operating controls</h2><p>Keep infrastructure choices out of the day-to-day UI while making policies explicit.</p></div></section>
  <div className="settingsGrid"><div><b>Data retention</b><span>Raw events and analytics policies</span></div><div><b>Automation safety</b><span>Approval rules, rate limits and allowed actions</span></div><div><b>Audit trail</b><span>Every decision and action attributable</span></div><div><b>Source priority</b><span>Which system is authoritative for each entity</span></div></div>
</>}

function CreateModal({close}:{close:()=>void}){const [name,setName]=useState("");const [trigger,setTrigger]=useState("Checkout abandoned");const save=async()=>{await fetch("/api/automations",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:name||"New automation",trigger,category:"Sales"})});close()};return <div className="overlay"><div className="modal"><div className="modalHead"><div><div className="eyebrow">WORKFLOW BUILDER</div><h2>Create an automation</h2><p>Start with the business event. The runtime then attaches context, policy, action and measurement.</p></div><button className="close" suppressHydrationWarning onClick={close}><X size={17}/></button></div><label>Name<input suppressHydrationWarning value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Recover VIP abandoned carts"/></label><label>Trigger<select suppressHydrationWarning value={trigger} onChange={e=>setTrigger(e.target.value)}>{recipes.map(r=><option key={r.trigger}>{r.trigger}</option>)}</select></label><div className="builder"><div><span>1 · TRIGGER</span><b>{trigger}</b></div><ChevronRight/><div><span>2 · CONTEXT</span><b>Load canonical state</b></div><ChevronRight/><div><span>3 · DECISION</span><b>Rules / AI</b></div><ChevronRight/><div><span>4 · ACTION</span><b>Execute + measure</b></div></div><div className="modalActions"><button className="secondary" suppressHydrationWarning onClick={close}>Cancel</button><button className="primary" suppressHydrationWarning onClick={save}>Create draft</button></div></div></div>}

function Metric({label,value,note}:{label:string;value:any;note:string}){return <div className="card metric"><small>{label}</small><strong>{value}</strong><span>{note}</span></div>}
function Opportunity({recipe,onClick}:{recipe:any;onClick:()=>void}){return <button className="opportunity" suppressHydrationWarning onClick={onClick}><div className="opIcon"><Sparkles size={13}/></div><div><b>{recipe.title}</b><small>{recipe.trigger} · {recipe.impact}</small></div><ChevronRight size={14}/></button>}
function SourcePill({source,live}:{source:Source;live?:LiveBundle}){const count=countRecords(source.id,live);return <div className="sourcePill"><div><b>{source.name}</b><span className={`status ${source.status}`}>{source.status}</span></div><small>{count!=null?`${count} records sampled`:"Connected and ready"}</small></div>}
function SourceCard({source,live}:{source:Source;live?:LiveBundle}){const count=countRecords(source.id,live);return <div className="sourceCard"><div className="sourceTitle"><div className="connectorIcon">{source.name.slice(0,1)}</div><div><b>{source.name}</b><span>{source.category}</span></div><span className={`status ${source.status}`}>{source.status}</span></div><p>{source.description}</p><div className="sourceMeta"><span>{live?"Live pull complete":"Not pulled in this view"}</span><b>{count!=null?count:"—"}</b></div></div>}
function EmptyState({title,copy,onClick}:{title:string;copy:string;onClick:()=>void}){return <div className="empty"><Database size={18}/><b>{title}</b><span>{copy}</span><button className="secondary" suppressHydrationWarning onClick={onClick}>Go there</button></div>}
function countRecords(id:string,live?:LiveBundle){if(!live)return null;const d=live.data; if(id==="shopify")return (d?.data?.orders?.nodes||d?.orders?.nodes||[]).length+(d?.data?.products?.nodes||d?.products?.nodes||[]).length; if(Array.isArray(d?.products))return d.products.length; if(Array.isArray(d?.orders))return d.orders.length; if(Array.isArray(d?.data))return d.data.length; return 1}
function money(v:any,currency?:string){const n=Number(v||0);if(!Number.isFinite(n))return "—";try{return new Intl.NumberFormat("en-IN",{style:"currency",currency:currency||"INR",maximumFractionDigits:2}).format(n)}catch{return `₹${n.toLocaleString("en-IN")}`}}
function BellDot(){return <div className="bellDot" aria-label="Notifications"><span/></div>}
function CheckCircle2Icon(){return <div className="okMark">✓</div>}
