import {createCipheriv,createDecipheriv,createHash,randomBytes} from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {cookies} from "next/headers";
import {getCurrentUser} from "@/lib/authStore";
export type ConnectorAuth={accessToken:string;refreshToken?:string;expiresAt?:number;tokenType?:string;scope?:string;connectedAt:number;meta:string|null;providerData?:Record<string,string>};
const BLOB_API="https://vercel.com/api/blob",BLOB_VERSION="12";
function encryptionSecret(){const configured=process.env.ENCRYPTION_KEY;if(configured)return configured;if(process.env.NODE_ENV==="production")throw new Error("ENCRYPTION_KEY must be configured in production");return "flowos-local-development-only-key";}
function hashKey(){return createHash("sha256").update(encryptionSecret()).digest();}
function encrypt(text:string){const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",hashKey(),iv);const enc=Buffer.concat([cipher.update(text,"utf8"),cipher.final()]);return JSON.stringify({iv:iv.toString("base64"),tag:cipher.getAuthTag().toString("base64"),d:enc.toString("base64")});}
function decrypt(text:string){const o=JSON.parse(text);const decipher=createDecipheriv("aes-256-gcm",hashKey(),Buffer.from(o.iv,"base64"));decipher.setAuthTag(Buffer.from(o.tag,"base64"));return Buffer.concat([decipher.update(Buffer.from(o.d,"base64")),decipher.final()]).toString("utf8");}
function localDir(){return path.join(process.env.NODE_ENV==="production"?os.tmpdir():process.cwd(),".flowos");}
function localFile(){return path.join(localDir(),"connectors.json");}
function localLoad(){try{if(!fs.existsSync(localFile()))return {};const raw=fs.readFileSync(localFile(),"utf8");return JSON.parse(raw.startsWith("{")&&raw.includes('"iv"')?decrypt(raw):raw) as Record<string,ConnectorAuth>;}catch{return {};}}
function localSave(data:Record<string,ConnectorAuth>){fs.mkdirSync(localDir(),{recursive:true});fs.writeFileSync(localFile(),encrypt(JSON.stringify(data)),{encoding:"utf8",mode:0o600});}
async function workspaceId(){try{const user=await getCurrentUser();if(user)return `user:${user.id}`;const c=await cookies();return c.get("tentran_workspace")?.value||"anonymous";}catch{return "anonymous";}}
function blobToken(){return process.env.BLOB_READ_WRITE_TOKEN||"";}
function blobHeaders(token:string){const h:Record<string,string>={authorization:`Bearer ${token}`,"x-api-version":BLOB_VERSION};const parts=token.split("_");if(parts.length>=5&&parts[0]==="vercel"&&parts[1]==="blob")h["x-vercel-blob-store-id"]=parts[3];return h;}
function blobPath(workspace:string){return `tentran/workspaces/${workspace}/connectors.json`;}
async function blobLoad(workspace:string){const token=blobToken();if(!token)return localLoad();const parts=token.split("_");const storeId=parts.length>=5&&parts[0]==="vercel"&&parts[1]==="blob"?parts[3]:"";const pathname=blobPath(workspace);const url=storeId?`https://${storeId}.private.blob.vercel-storage.com/${pathname}`:`${BLOB_API}?url=${encodeURIComponent(pathname)}`;const res=await fetch(url,{headers:blobHeaders(token),cache:"no-store"});if(res.status===404)return {};if(!res.ok)throw new Error(`Connector storage read failed (${res.status})`);return JSON.parse(decrypt(await res.text())) as Record<string,ConnectorAuth>;}
async function blobSave(workspace:string,data:Record<string,ConnectorAuth>){const token=blobToken();if(!token){localSave(data);return;}const pathname=blobPath(workspace);const res=await fetch(`${BLOB_API}?pathname=${encodeURIComponent(pathname)}`,{method:"PUT",headers:{...blobHeaders(token),access:"private","x-add-random-suffix":"0","x-allow-overwrite":"1","x-content-type":"application/json"},body:encrypt(JSON.stringify(data)),cache:"no-store"});if(!res.ok)throw new Error(`Connector storage write failed (${res.status})`);}
export async function migrateWorkspace(from:string,to:string){if(!from||!to||from===to)return;const source=await blobLoad(from);if(!Object.keys(source).length)return;const target=await blobLoad(to);await blobSave(to,{...source,...target});}
export function getConnector(id:string){return localLoad()[`connector:${id}`];}
export function setConnector(id:string,auth:ConnectorAuth){const data=localLoad();data[`connector:${id}`]=auth;localSave(data);}
export function removeConnector(id:string){const data=localLoad();delete data[`connector:${id}`];localSave(data);}
export function listAuth(){return localLoad();}
export async function getConnectorAsync(id:string){const data=await blobLoad(await workspaceId());return data[`connector:${id}`];}
export async function setConnectorAsync(id:string,auth:ConnectorAuth){const workspace=await workspaceId();const data=await blobLoad(workspace);data[`connector:${id}`]=auth;await blobSave(workspace,data);}
export async function removeConnectorAsync(id:string){const workspace=await workspaceId();const data=await blobLoad(workspace);delete data[`connector:${id}`];await blobSave(workspace,data);}
