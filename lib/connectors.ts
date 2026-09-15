import {providers, type Provider} from "@/lib/oauth";

export type AuthMode = "oauth2" | "credential";
export type ConnectorCapability = "read" | "write" | "webhook" | "sync";
export type ConnectorDefinition = { id:string; name:string; authMode:AuthMode; apiVersion?:string; scopes?:string[]; capabilities:ConnectorCapability[]; official:boolean; provider:Provider };

const oauthIds = new Set(["shopify","google-sheets","gmail","google-ads","meta","tiktok","klaviyo","stripe","bigcommerce","wix","amazon"]);
const capabilityMap: Record<string, ConnectorCapability[]> = {
  shopify:["read","write","sync","webhook"], "google-sheets":["read","sync"], gmail:["read","write"], "google-ads":["read","sync"], meta:["read","write","sync","webhook"], tiktok:["read","sync"], klaviyo:["read","write","sync","webhook"], stripe:["read","write","sync","webhook"], bigcommerce:["read","write","sync","webhook"], wix:["read","sync"], amazon:["read","sync","webhook"], razorpay:["read","write","sync","webhook"], woocommerce:["read","write","sync","webhook"], whatsapp:["read","write","webhook"], shiprocket:["read","write","sync"], delhivery:["read","sync"], magento:["read","write","sync"], meesho:["read","sync"], flipkart:["read","sync"]
};
export function connectorDefinitions():ConnectorDefinition[]{return Object.values(providers).map(provider=>({id:provider.id,name:provider.name,authMode:oauthIds.has(provider.id)?"oauth2":"credential",apiVersion:provider.id==="shopify"?"2025-07":undefined,scopes:provider.scopes?.split(" ").filter(Boolean),capabilities:capabilityMap[provider.id]||["read"],official:true,provider}));}
export function getConnectorDefinition(id:string){return connectorDefinitions().find(c=>c.id===id);}
export function assertOfficialCapability(id:string, capability:ConnectorCapability){const c=getConnectorDefinition(id);if(!c||!c.official)throw new Error("Unsupported official connector");if(!c.capabilities.includes(capability))throw new Error(`${c.name} does not support ${capability}`);return c;}
export function assertOAuthConfiguration(id:string){const c=getConnectorDefinition(id);if(!c)throw new Error("Unknown connector");if(c.authMode!=="oauth2")throw new Error(`${c.name} does not officially support OAuth for this integration; use its documented credential flow.`);if(!c.provider.clientId||!c.provider.clientSecret)throw new Error(`${c.name} OAuth is not configured. Configure the official app credentials before connecting.`);return c;}
