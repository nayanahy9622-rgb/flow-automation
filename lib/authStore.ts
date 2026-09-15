import {createCipheriv,createDecipheriv,createHash,randomBytes,scryptSync,timingSafeEqual} from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {cookies} from "next/headers";

export type User={id:string;email:string;name:string;passwordHash:string;createdAt:number};
type Session={userId:string;createdAt:number;expiresAt:number};
const BLOB_API="https://vercel.com/api/blob";
const BLOB_VERSION="12";
const SESSION_COOKIE="tentran_session";

function secret(){const s=process.env.ENCRYPTION_KEY;if(s)return s;if(process.env.NODE_ENV==="production")throw new Error("ENCRYPTION_KEY must be configured in production");return "tentran-local-development-key";}
function key(){return createHash("sha256").update(secret()).digest();}
function encrypt(text:string){const iv=randomBytes(12);const c=createCipheriv("aes-256-gcm",key(),iv);const d=Buffer.concat([c.update(text,"utf8"),c.final()]);return JSON.stringify({iv:iv.toString("base64"),tag:c.getAuthTag().toString("base64"),d:d.toString("base64")});}
function decrypt(text:string){const o=JSON.parse(text);const d=createDecipheriv("aes-256-gcm",key(),Buffer.from(o.iv,"base64"));d.setAuthTag(Buffer.from(o.tag,"base64"));return Buffer.concat([d.update(Buffer.from(o.d,"base64")),d.final()]).toString("utf8");}
function localFile(name:string){return path.join(process.env.NODE_ENV==="production"?os.tmpdir():process.cwd(),".flowos",name);}
function localLoad<T>(name:string):T{try{const f=localFile(name);if(!fs.existsSync(f))return {} as T;return JSON.parse(decrypt(fs.readFileSync(f,"utf8")));}catch{return {} as T;}}
function localSave<T>(name:string,data:T){const f=localFile(name);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,encrypt(JSON.stringify(data)),{encoding:"utf8",mode:0o600});}
function token(){return process.env.BLOB_READ_WRITE_TOKEN||"";}
function headers(t:string){const h:Record<string,string>={authorization:`Bearer ${t}`,"x-api-version":BLOB_VERSION};const p=t.split("_");if(p.length>=5&&p[0]==="vercel"&&p[1]==="blob")h["x-vercel-blob-store-id"]=p[3];return h;}
function blobUrl(pathname:string){const t=token();const p=t.split("_");const store=p.length>=5&&p[0]==="vercel"&&p[1]==="blob"?p[3]:"";return store?`https://${store}.private.blob.vercel-storage.com/${pathname}`:`${BLOB_API}?url=${encodeURIComponent(pathname)}`;}
async function load<T>(pathname:string,file:string):Promise<T>{const t=token();if(!t)return localLoad<T>(file);const r=await fetch(blobUrl(pathname),{headers:headers(t),cache:"no-store"});if(r.status===404)return {} as T;if(!r.ok)throw new Error(`Auth storage read failed (${r.status})`);return JSON.parse(decrypt(await r.text()));}
async function save<T>(pathname:string,data:T,file:string){const t=token();if(!t){localSave(file,data);return;}const r=await fetch(`${BLOB_API}?pathname=${encodeURIComponent(pathname)}`,{method:"PUT",headers:{...headers(t),access:"private","x-add-random-suffix":"0","x-allow-overwrite":"1","x-content-type":"application/json"},body:encrypt(JSON.stringify(data)),cache:"no-store"});if(!r.ok)throw new Error(`Auth storage write failed (${r.status})`);}

function hashPassword(password:string,salt= randomBytes(16).toString("hex")){return `${salt}:${scryptSync(password,salt,64).toString("hex")}`;}
function checkPassword(password:string,stored:string){const [salt,hex]=stored.split(":");if(!salt||!hex)return false;const a=Buffer.from(hex,"hex"),b=scryptSync(password,salt,64);return a.length===b.length&&timingSafeEqual(a,b);}

export async function createUser(name:string,email:string,password:string){const users=await load<Record<string,User>>("tentran/auth/users.json","users.json");const normalized=email.trim().toLowerCase();if(Object.values(users).some(u=>u.email===normalized))throw new Error("An account with this email already exists.");const user:User={id:randomBytes(16).toString("hex"),email:normalized,name:name.trim()||normalized.split("@")[0],passwordHash:hashPassword(password),createdAt:Date.now()};users[user.id]=user;await save("tentran/auth/users.json",users,"users.json");return user;}
export async function authenticate(email:string,password:string){const users=await load<Record<string,User>>("tentran/auth/users.json","users.json");const user=Object.values(users).find(u=>u.email===email.trim().toLowerCase());if(!user||!checkPassword(password,user.passwordHash))return null;return user;}
export async function createSession(userId:string){const sessions=await load<Record<string,Session>>("tentran/auth/sessions.json","sessions.json");const id=randomBytes(32).toString("base64url");sessions[id]={userId,createdAt:Date.now(),expiresAt:Date.now()+1000*60*60*24*30};await save("tentran/auth/sessions.json",sessions,"sessions.json");return id;}
export async function getCurrentUser(){try{const c=await cookies();const sid=c.get(SESSION_COOKIE)?.value;if(!sid)return null;const sessions=await load<Record<string,Session>>("tentran/auth/sessions.json","sessions.json");const session=sessions[sid];if(!session||session.expiresAt<Date.now())return null;const users=await load<Record<string,User>>("tentran/auth/users.json","users.json");return users[session.userId]||null;}catch{return null;}}
export function sessionCookie(value:string){return {name:SESSION_COOKIE,value,httpOnly:true,sameSite:"lax" as const,secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*30};}
export function clearSessionCookie(){return {name:SESSION_COOKIE,value:"",httpOnly:true,sameSite:"lax" as const,secure:process.env.NODE_ENV==="production",path:"/",maxAge:0};}

export type StoredAutomation={id:string;name:string;trigger:string;action:string;status:"draft"|"active"|"paused";createdAt:number;updatedAt:number;userId:string};
export async function listAutomations(userId:string){const all=await load<Record<string,StoredAutomation>>("tentran/automations/workflows.json","automations.json");return Object.values(all).filter((item)=>item.userId===userId).sort((a,b)=>b.updatedAt-a.updatedAt);}
export async function createAutomation(userId:string,input:Pick<StoredAutomation,"name"|"trigger"|"action">){const all=await load<Record<string,StoredAutomation>>("tentran/automations/workflows.json","automations.json");const now=Date.now();const item:StoredAutomation={id:randomBytes(12).toString("hex"),userId,name:input.name.trim(),trigger:input.trigger.trim(),action:input.action.trim(),status:"draft",createdAt:now,updatedAt:now};all[item.id]=item;await save("tentran/automations/workflows.json",all,"automations.json");return item;}
