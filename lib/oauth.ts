import {randomBytes} from "crypto";
import {getConnector, setConnector, ConnectorAuth} from "./connectorStore";

export type ProviderMode = "oauth" | "api-key" | "manual";
export type Provider = {
  id: string;
  name: string;
  mode: ProviderMode;
  clientId?: string;
  clientSecret?: string;
  scopes?: string;
  authorize?: (clientId: string, redirectUri: string, state: string) => string;
  exchange?: (clientId: string, clientSecret: string, code: string, redirectUri: string) => Promise<ConnectorAuth>;
  summary?: (auth: ConnectorAuth) => Promise<string>;
  data?: (auth: ConnectorAuth) => Promise<unknown>;
  apiKeys?: (string | undefined)[];
  tokenFields?: {env: string; label: string; placeholder: string; secret?: boolean}[];
  validate?: (auth: ConnectorAuth) => Promise<void>;
  manualNote?: string;
};

const appUrl = () => process.env.APP_URL || "http://localhost:3000";
export const connectorCallback = (id: string) => `${appUrl()}/api/connectors/${id}/callback`;

async function tokenExchange(url: string, form: Record<string, string>): Promise<ConnectorAuth> {
  const res = await fetch(url, {method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams(form)});
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
  const accessToken = json.access_token || json.accessToken;
  if (!accessToken) throw new Error("Token exchange returned no access_token");
  const providerData: Record<string,string> = {};
  for (const [from,to] of [["context","context"],["store_hash","storeHash"],["user_id","userId"],["scope","scope"]]) if(typeof json[from]==="string") providerData[to]=json[from];
  return {accessToken,refreshToken:json.refresh_token,expiresAt:json.expires_in?Date.now()+Number(json.expires_in)*1000:undefined,tokenType:json.token_type,scope:json.scope,connectedAt:Date.now(),meta:null,providerData};
}

async function jsonFetch(url:string,init:RequestInit={}){const res=await fetch(url,{cache:"no-store",...init});const json=await res.json().catch(()=>({}));if(!res.ok)throw new Error(`${res.status}: ${JSON.stringify(json)}`);return json;}

function razorpayData(auth: ConnectorAuth) {
  const [key, secret] = auth.accessToken.split("|");
  if (!key || !secret) throw new Error("Razorpay credentials incomplete");
  const basic = Buffer.from(`${key}:${secret}`).toString("base64");
  const h = {authorization: `Basic ${basic}`, accept: "application/json"};
  return Promise.all([
    jsonFetch("https://api.razorpay.com/v1/balance", {headers: h}),
    jsonFetch("https://api.razorpay.com/v1/payments?count=5", {headers: h}),
  ]).then(([balance, payments]) => ({balance, payments}));
}

function delhiveryData(auth: ConnectorAuth) {
  return jsonFetch("https://track.delhivery.com/api/v1/packages/json/?count=5", {
    headers: {authorization: `Token ${auth.accessToken}`, accept: "application/json"},
  });
}

function magentoData(auth: ConnectorAuth) {
  const [base, adminToken] = auth.accessToken.split("|");
  if (!base || !adminToken) throw new Error("Magento credentials incomplete");
  const store = base.replace(/\/$/, "");
  const h = {authorization: `Bearer ${adminToken}`, accept: "application/json"};
  return Promise.all([
    jsonFetch(`${store}/rest/V1/products?searchCriteria[pageSize]=5`, {headers: h}),
    jsonFetch(`${store}/rest/V1/orders?searchCriteria[pageSize]=5`, {headers: h}),
  ]).then(([products, orders]) => ({products, orders}));
}

async function meeshoData(auth: ConnectorAuth) {
  const [key, secret] = auth.accessToken.split("|");
  if (!key || !secret) throw new Error("Meesho credentials incomplete");
  const basic = Buffer.from(`${key}:${secret}`).toString("base64");
  const h = {authorization: `Basic ${basic}`, accept: "application/json"};
  const [orders, products] = await Promise.all([
    jsonFetch("https://api.meesho.com/v1/orders?limit=5", {headers: h}),
    jsonFetch("https://api.meesho.com/v1/products?limit=5", {headers: h}),
  ]);
  return {orders, products};
}

async function flipkartData(auth: ConnectorAuth) {
  const [key, secret] = auth.accessToken.split("|");
  if (!key || !secret) throw new Error("Flipkart credentials incomplete");
  const tokenRes = await fetch("https://api.flipkart.net/fskoken/fskoken", {
    method: "POST",
    headers: {"content-type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({key, secret}),
    cache: "no-store",
  });
  const tokenJson = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenJson.access_token) throw new Error(`Flipkart token exchange failed: ${tokenRes.status}`);
  const orders = await jsonFetch("https://api.flipkart.net/sellerservice/v3.0.0/orders/search", {
    method: "POST",
    headers: {authorization: `Bearer ${tokenJson.access_token}`, "content-type": "application/json", accept: "application/json"},
    body: JSON.stringify({pagination: {pageSize: 5}}),
  });
  return {tokenIssuedAt: Date.now(), orders};
}

const googleScopes=["openid","https://www.googleapis.com/auth/userinfo.email","https://www.googleapis.com/auth/spreadsheets.readonly","https://www.googleapis.com/auth/drive.readonly","https://www.googleapis.com/auth/gmail.readonly","https://www.googleapis.com/auth/gmail.send"].join(" ");
const google={mode:"oauth" as const,clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET,scopes:googleScopes,authorize:(clientId:string,redirectUri:string,state:string)=>`https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(googleScopes)}&state=${encodeURIComponent(state)}&access_type=offline&prompt=consent`,exchange:async(clientId:string,clientSecret:string,code:string,redirectUri:string)=>tokenExchange("https://oauth2.googleapis.com/token",{client_id:clientId,client_secret:clientSecret,code,redirect_uri:redirectUri,grant_type:"authorization_code"}),summary:async(auth:ConnectorAuth)=>{const me=await jsonFetch("https://openidconnect.googleapis.com/v1/userinfo",{headers:{authorization:`Bearer ${auth.accessToken}`}});return `Connected as ${me.email||me.name||"Google user"}`;},data:async(auth:ConnectorAuth)=>{const [profile,drive,gmail]=await Promise.all([jsonFetch("https://openidconnect.googleapis.com/v1/userinfo",{headers:{authorization:`Bearer ${auth.accessToken}`}}),jsonFetch("https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime,webViewLink)&orderBy=modifiedTime%20desc",{headers:{authorization:`Bearer ${auth.accessToken}`}}),jsonFetch("https://gmail.googleapis.com/gmail/v1/users/me/profile",{headers:{authorization:`Bearer ${auth.accessToken}`}})]);return {profile,driveFiles:drive.files||[],gmailProfile:gmail};}};

export const providers:Record<string,Provider>={
shopify:{id:"shopify",name:"Shopify",mode:"oauth",clientId:process.env.SHOPIFY_CLIENT_ID,clientSecret:process.env.SHOPIFY_CLIENT_SECRET,scopes:"read_products,read_orders,read_customers,read_inventory,write_products",authorize:(clientId,redirectUri,state)=>`https://${process.env.SHOPIFY_SHOP}/admin/oauth/authorize?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent("read_products,read_orders,read_customers,read_inventory,write_products")}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,exchange:async(clientId,clientSecret,code,redirectUri)=>tokenExchange(`https://${process.env.SHOPIFY_SHOP}/admin/oauth/access_token`,{client_id:clientId,client_secret:clientSecret,code}),summary:async(auth)=>{const s=await jsonFetch(`https://${process.env.SHOPIFY_SHOP}/admin/api/2025-07/shop.json`,{headers:{"X-Shopify-Access-Token":auth.accessToken}});return `Connected to ${s.shop?.name||process.env.SHOPIFY_SHOP}`;},data:async(auth)=>jsonFetch(`https://${process.env.SHOPIFY_SHOP}/admin/api/2025-07/graphql.json`,{method:"POST",headers:{"content-type":"application/json","X-Shopify-Access-Token":auth.accessToken},body:JSON.stringify({query:"query { shop { id name email myshopifyDomain } products(first:20) { nodes { id title status totalInventory } } orders(first:20, sortKey:PROCESSED_AT, reverse:true) { nodes { id name displayFinancialStatus displayFulfillmentStatus totalPriceSet { shopMoney { amount currencyCode } } } } }"})}),},
"google-sheets":{...google,id:"google-sheets",name:"Google Sheets"},gmail:{...google,id:"gmail",name:"Gmail"},"google-ads":{...google,id:"google-ads",name:"Google Ads",data:async()=>({message:"Google OAuth is connected. Google Ads reporting additionally needs a Google Ads developer token and customer ID."})},
meta:{id:"meta",name:"Meta",mode:"oauth",clientId:process.env.META_CLIENT_ID,clientSecret:process.env.META_CLIENT_SECRET,scopes:"ads_management,ads_read,business_management",authorize:(clientId,redirectUri,state)=>`https://www.facebook.com/v23.0/dialog/oauth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent("ads_management,ads_read,business_management")}`,exchange:async(clientId,clientSecret,code,redirectUri)=>tokenExchange("https://graph.facebook.com/v23.0/oauth/access_token",{client_id:clientId,client_secret:clientSecret,redirect_uri:redirectUri,code}),summary:async(auth)=>{const me=await jsonFetch("https://graph.facebook.com/v23.0/me?fields=id,name",{headers:{authorization:`Bearer ${auth.accessToken}`}});return `Connected to ${me.name||"Meta account"}`;},data:async(auth)=>{const [me,adAccounts]=await Promise.all([jsonFetch("https://graph.facebook.com/v23.0/me?fields=id,name",{headers:{authorization:`Bearer ${auth.accessToken}`}}),jsonFetch("https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name,account_status,currency&limit=50",{headers:{authorization:`Bearer ${auth.accessToken}`}})]);return {account:me,adAccounts:adAccounts.data||[]};}},
tiktok:{id:"tiktok",name:"TikTok",mode:"oauth",clientId:process.env.TIKTOK_CLIENT_KEY,clientSecret:process.env.TIKTOK_CLIENT_SECRET,scopes:"user.info.basic,video.list",authorize:(clientId,redirectUri,state)=>`https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(clientId)}&scope=${encodeURIComponent("user.info.basic,video.list")}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,exchange:async(clientId,clientSecret,code,redirectUri)=>tokenExchange("https://open.tiktokapis.com/v2/oauth/token/",{client_key:clientId,client_secret:clientSecret,code,grant_type:"authorization_code",redirect_uri:redirectUri}),summary:async(auth)=>{const me=await jsonFetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",{headers:{authorization:`Bearer ${auth.accessToken}`}});return `Connected as ${me.data?.user?.display_name||"TikTok user"}`;},data:async(auth)=>jsonFetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",{headers:{authorization:`Bearer ${auth.accessToken}`}})},
klaviyo:{id:"klaviyo",name:"Klaviyo",mode:"oauth",clientId:process.env.KLAVIYO_CLIENT_ID,clientSecret:process.env.KLAVIYO_CLIENT_SECRET,scopes:"accounts:read lists:read",authorize:(clientId,redirectUri,state)=>`https://www.klaviyo.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("accounts:read lists:read")}&state=${encodeURIComponent(state)}`,exchange:async(clientId,clientSecret,code,redirectUri)=>tokenExchange("https://a.klaviyo.com/oauth/token",{client_id:clientId,client_secret:clientSecret,code,redirect_uri:redirectUri,grant_type:"authorization_code"}),summary:async(auth)=>{const r=await jsonFetch("https://a.klaviyo.com/api/accounts/",{headers:{authorization:`Bearer ${auth.accessToken}`,revision:"2026-01-15"}});return `Connected to ${r.data?.[0]?.attributes?.contact_information?.default_sender_email||"Klaviyo account"}`;},data:async(auth)=>jsonFetch("https://a.klaviyo.com/api/accounts/",{headers:{authorization:`Bearer ${auth.accessToken}`,revision:"2026-01-15"}})},
stripe:{id:"stripe",name:"Stripe",mode:"oauth",clientId:process.env.STRIPE_CLIENT_ID,clientSecret:process.env.STRIPE_SECRET_KEY,scopes:"read_write",authorize:(clientId,redirectUri,state)=>`https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,exchange:async(clientId,clientSecret,code,redirectUri)=>tokenExchange("https://connect.stripe.com/oauth/token",{client_id:clientId,client_secret:clientSecret,code,grant_type:"authorization_code",redirect_uri:redirectUri}),summary:async(auth)=>{const a=await jsonFetch("https://api.stripe.com/v1/account",{headers:{authorization:`Bearer ${auth.accessToken}`}});return `Connected to ${a.business_profile?.name||a.settings?.dashboard?.display_name||a.email||"Stripe account"}`;},data:async(auth)=>{const [account,balance,charges]=await Promise.all([jsonFetch("https://api.stripe.com/v1/account",{headers:{authorization:`Bearer ${auth.accessToken}`}}),jsonFetch("https://api.stripe.com/v1/balance",{headers:{authorization:`Bearer ${auth.accessToken}`}}),jsonFetch("https://api.stripe.com/v1/charges?limit=20",{headers:{authorization:`Bearer ${auth.accessToken}`}})]);return {account,balance,charges};}},
bigcommerce:{id:"bigcommerce",name:"BigCommerce",mode:"oauth",clientId:process.env.BIGCOMMERCE_CLIENT_ID,clientSecret:process.env.BIGCOMMERCE_CLIENT_SECRET,scopes:"store_v2_products store_v2_orders store_v2_customers store_v2_information",authorize:(clientId,redirectUri,state)=>`https://login.bigcommerce.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent("store_v2_products store_v2_orders store_v2_customers store_v2_information")}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,exchange:async(clientId,clientSecret,code,redirectUri)=>tokenExchange("https://login.bigcommerce.com/oauth2/token",{client_id:clientId,client_secret:clientSecret,code,redirect_uri:redirectUri,grant_type:"authorization_code"}),summary:async(auth)=>`Connected to BigCommerce${auth.providerData?.context?` (${auth.providerData.context})`:""}`,data:async(auth)=>{const context=auth.providerData?.context||"";const storeHash=auth.providerData?.storeHash||context.split("/").pop();if(!storeHash)return {message:"BigCommerce OAuth succeeded but no store context was returned."};const h={"X-Auth-Token":auth.accessToken,accept:"application/json"};const [store,products,orders,customers]=await Promise.all([jsonFetch(`https://api.bigcommerce.com/stores/${storeHash}/v2/store`,{headers:h}),jsonFetch(`https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products?limit=20`,{headers:h}),jsonFetch(`https://api.bigcommerce.com/stores/${storeHash}/v2/orders?limit=20`,{headers:h}),jsonFetch(`https://api.bigcommerce.com/stores/${storeHash}/v2/customers?limit=20`,{headers:h})]);return {store,products,orders,customers};}},
wix:{id:"wix",name:"Wix",mode:"oauth",clientId:process.env.WIX_CLIENT_ID,clientSecret:process.env.WIX_CLIENT_SECRET,authorize:(clientId,redirectUri,state)=>`https://www.wix.com/installer/install?appDefinitionId=${encodeURIComponent(clientId)}&redirectUrl=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,exchange:async(clientId,clientSecret,code)=>tokenExchange("https://www.wixapis.com/oauth2/token",{grant_type:"authorization_code",client_id:clientId,client_secret:clientSecret,code}),summary:async()=>"Wix authorization completed.",data:async()=>({message:"Wix OAuth token acquired. Enable the Wix app permissions required for the site resources your workflow will read."})},
amazon:{id:"amazon",name:"Amazon",mode:"oauth",clientId:process.env.AMAZON_CLIENT_ID,clientSecret:process.env.AMAZON_CLIENT_SECRET,authorize:(clientId,redirectUri,state)=>`https://sellercentral.amazon.com/apps/authorize/consent?application_id=${encodeURIComponent(clientId)}&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`,exchange:async(clientId,clientSecret,code,redirectUri)=>tokenExchange("https://api.amazon.com/auth/o2/token",{grant_type:"authorization_code",client_id:clientId,client_secret:clientSecret,code,redirect_uri:redirectUri}),summary:async()=>"Amazon Seller Central authorization completed.",data:async()=>({message:"Amazon seller authorization stored. SP-API operational calls require the authorized marketplace/region and application role configuration."})},
razorpay:{id:"razorpay",name:"Razorpay",mode:"api-key",apiKeys:[process.env.RAZORPAY_KEY_ID,process.env.RAZORPAY_KEY_SECRET],tokenFields:[{env:"RAZORPAY_KEY_ID",label:"Razorpay Key ID",placeholder:"rzp_live_xxxxxxxx"},{env:"RAZORPAY_KEY_SECRET",label:"Razorpay Key Secret",placeholder:"(key secret)",secret:true}],data:razorpayData,validate:async(auth)=>{await razorpayData(auth)}},
woocommerce:{id:"woocommerce",name:"WooCommerce",mode:"api-key",apiKeys:[process.env.WOO_STORE_URL,process.env.WOO_CONSUMER_KEY,process.env.WOO_CONSUMER_SECRET],tokenFields:[{env:"WOO_STORE_URL",label:"Store URL",placeholder:"https://store.example.com"},{env:"WOO_CONSUMER_KEY",label:"Consumer key",placeholder:"ck_xxxx"},{env:"WOO_CONSUMER_SECRET",label:"Consumer secret",placeholder:"cs_xxxx",secret:true}],data:async(auth)=>{const [storeUrl,key,secret]=auth.accessToken.split("|");if(!storeUrl||!key||!secret)throw new Error("WooCommerce credentials incomplete");const base=storeUrl.replace(/\/$/,"");const basic=Buffer.from(`${key}:${secret}`).toString("base64");const h={authorization:`Basic ${basic}`,accept:"application/json"};const [system,products,orders,customers]=await Promise.all([jsonFetch(`${base}/wp-json/wc/v3/system_status`,{headers:h}),jsonFetch(`${base}/wp-json/wc/v3/products?per_page=20`,{headers:h}),jsonFetch(`${base}/wp-json/wc/v3/orders?per_page=20`,{headers:h}),jsonFetch(`${base}/wp-json/wc/v3/customers?per_page=20`,{headers:h})]);return {system,products,orders,customers};},validate:async(auth)=>{const [storeUrl,key,secret]=auth.accessToken.split("|");if(!storeUrl||!key||!secret)throw new Error("WooCommerce credentials incomplete");const base=storeUrl.replace(/\/$/,"");const basic=Buffer.from(`${key}:${secret}`).toString("base64");await jsonFetch(`${base}/wp-json/wc/v3/system_status`,{headers:{authorization:`Basic ${basic}`,accept:"application/json"}});}},
whatsapp:{id:"whatsapp",name:"WhatsApp",mode:"api-key",apiKeys:[process.env.WHATSAPP_ACCESS_TOKEN,process.env.WHATSAPP_PHONE_NUMBER_ID],tokenFields:[{env:"WHATSAPP_ACCESS_TOKEN",label:"Access token",placeholder:"(long-lived system user token)",secret:true},{env:"WHATSAPP_PHONE_NUMBER_ID",label:"Phone number ID",placeholder:"(phone number id)"}],data:async(auth)=>{const [token,phoneId]=auth.accessToken.split("|");if(!token||!phoneId)throw new Error("WhatsApp credentials incomplete");return jsonFetch(`https://graph.facebook.com/v23.0/${phoneId}?fields=id,display_phone_number,verified_name,quality_rating`,{headers:{authorization:`Bearer ${token}`}});},validate:async(auth)=>{const [token,phoneId]=auth.accessToken.split("|");if(!token||!phoneId)throw new Error("WhatsApp credentials incomplete");await jsonFetch(`https://graph.facebook.com/v23.0/${phoneId}?fields=id,display_phone_number,verified_name,quality_rating`,{headers:{authorization:`Bearer ${token}`}});}},
shiprocket:{id:"shiprocket",name:"Shiprocket",mode:"api-key",apiKeys:[process.env.SHIPROCKET_API_TOKEN],tokenFields:[{env:"SHIPROCKET_API_TOKEN",label:"Shiprocket API token",placeholder:"(email based API token)",secret:true}],data:async(auth)=>jsonFetch("https://apiv2.shiprocket.in/v1/external/orders?per_page=20&page=1",{headers:{authorization:`Bearer ${auth.accessToken}`}}),validate:async(auth)=>{await jsonFetch("https://apiv2.shiprocket.in/v1/external/orders?per_page=20&page=1",{headers:{authorization:`Bearer ${auth.accessToken}`}});}},
delhivery:{id:"delhivery",name:"Delhivery",mode:"api-key",apiKeys:[process.env.DELHIVERY_API_TOKEN],tokenFields:[{env:"DELHIVERY_API_TOKEN",label:"Delhivery API Token",placeholder:"(api token)",secret:true}],data:delhiveryData,validate:async(auth)=>{await delhiveryData(auth)}},
magento:{id:"magento",name:"Magento",mode:"api-key",apiKeys:[process.env.MAGENTO_STORE_URL,process.env.MAGENTO_ADMIN_TOKEN],tokenFields:[{env:"MAGENTO_STORE_URL",label:"Magento store URL",placeholder:"https://store.example.com"},{env:"MAGENTO_ADMIN_TOKEN",label:"Admin API bearer token",placeholder:"(admin token)",secret:true}],data:magentoData,validate:async(auth)=>{await magentoData(auth)}},
flipkart:{id:"flipkart",name:"Flipkart",mode:"api-key",apiKeys:[process.env.FLIPKART_API_KEY,process.env.FLIPKART_API_SECRET],tokenFields:[{env:"FLIPKART_API_KEY",label:"Flipkart API key",placeholder:"(api key)"},{env:"FLIPKART_API_SECRET",label:"Flipkart API secret",placeholder:"(api secret)",secret:true}],data:flipkartData,validate:async(auth)=>{await flipkartData(auth)}},
meesho:{id:"meesho",name:"Meesho",mode:"api-key",apiKeys:[process.env.MEESHO_API_KEY,process.env.MEESHO_API_SECRET],tokenFields:[{env:"MEESHO_API_KEY",label:"Meesho API key",placeholder:"(api key)"},{env:"MEESHO_API_SECRET",label:"Meesho API secret",placeholder:"(api secret)",secret:true}],data:meeshoData,validate:async(auth)=>{await meeshoData(auth)}},
myntra:{id:"myntra",name:"Myntra",mode:"manual",manualNote:"Myntra partner APIs require approved seller integration and credentials issued by Myntra Partner Services."}
};

export function getProvider(id:string):Provider|undefined{return providers[id];}
export function providerState():string{return randomBytes(32).toString("hex");}
export async function completeOAuth(id:string,code:string):Promise<void>{const p=getProvider(id);if(!p||p.mode!=="oauth"||!p.exchange||!p.clientId||!p.clientSecret)throw new Error("unsupported connector or missing credentials");const auth=await p.exchange(p.clientId,p.clientSecret,code,connectorCallback(id));if(p.summary){try{auth.meta=await p.summary(auth);}catch{auth.meta=null;}}setConnector(id,auth);}
export function saveApiKeyConnector(id:string,keys:string[]):void{setConnector(id,{accessToken:keys.join("|"),connectedAt:Date.now(),meta:"API credentials configured"});}
export function missingCredentials(p:Provider):string[]{if(p.mode==="oauth"){const missing:string[]=[];if(!p.clientId)missing.push(`${p.name} client ID`);if(!p.clientSecret)missing.push(`${p.name} client secret`);if(p.id==="shopify"&&!process.env.SHOPIFY_SHOP)missing.push("SHOPIFY_SHOP store domain");return missing;}if(p.mode==="api-key")return(p.apiKeys||[]).map((v,i)=>v?"":envVarFor(p.id,i)).filter(Boolean);return[];}
export function envVarFor(id:string,index:number):string{const map:Record<string,string[]>={shopify:["SHOPIFY_CLIENT_ID","SHOPIFY_CLIENT_SECRET","SHOPIFY_SHOP"],"google-sheets":["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET"],gmail:["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET"],"google-ads":["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET"],meta:["META_CLIENT_ID","META_CLIENT_SECRET"],tiktok:["TIKTOK_CLIENT_KEY","TIKTOK_CLIENT_SECRET"],klaviyo:["KLAVIYO_CLIENT_ID","KLAVIYO_CLIENT_SECRET"],stripe:["STRIPE_CLIENT_ID","STRIPE_SECRET_KEY"],bigcommerce:["BIGCOMMERCE_CLIENT_ID","BIGCOMMERCE_CLIENT_SECRET"],wix:["WIX_CLIENT_ID","WIX_CLIENT_SECRET"],amazon:["AMAZON_CLIENT_ID","AMAZON_CLIENT_SECRET"],razorpay:["RAZORPAY_KEY_ID","RAZORPAY_KEY_SECRET"],woocommerce:["WOO_STORE_URL","WOO_CONSUMER_KEY","WOO_CONSUMER_SECRET"],whatsapp:["WHATSAPP_ACCESS_TOKEN","WHATSAPP_PHONE_NUMBER_ID"],shiprocket:["SHIPROCKET_API_TOKEN"],delhivery:["DELHIVERY_API_TOKEN"],magento:["MAGENTO_STORE_URL","MAGENTO_ADMIN_TOKEN"],flipkart:["FLIPKART_API_KEY","FLIPKART_API_SECRET"],meesho:["MEESHO_API_KEY","MEESHO_API_SECRET"]};return map[id]?.[index]||"";}
export async function pullConnectorData(id:string):Promise<unknown>{const p=getProvider(id);const auth=getConnector(id);if(!p)throw new Error("unknown connector");if(!auth)throw new Error("connector not connected");if(p.data)return p.data(auth);throw new Error("provider data adapter unavailable");}
