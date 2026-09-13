import {createCipheriv, createDecipheriv, createHash, randomBytes} from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export type ConnectorAuth = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
  connectedAt: number;
  meta: string | null;
  providerData?: Record<string, string>;
};

let storeDir: string | null = null;
function resolveStoreDir(): string {
  if (storeDir) return storeDir;
  const candidates = [path.join(process.cwd(), ".flowos"), path.join(os.tmpdir(), "flowos-store")];
  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, {recursive: true});
      const probe = path.join(dir, ".probe");
      fs.writeFileSync(probe, "x");
      fs.unlinkSync(probe);
      storeDir = dir;
      return dir;
    } catch {}
  }
  storeDir = path.join(os.tmpdir(), "flowos-store");
  return storeDir;
}
const storeFile = () => path.join(resolveStoreDir(), "connectors.json");

function encryptionSecret(): string {
  const configured = process.env.ENCRYPTION_KEY;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") throw new Error("ENCRYPTION_KEY must be configured in production");
  return "flowos-local-development-only-key";
}

function hashKey(): Buffer { return createHash("sha256").update(encryptionSecret()).digest(); }

function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", hashKey(), iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return JSON.stringify({iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), d: enc.toString("base64")});
}

function decrypt(text: string): string {
  const o = JSON.parse(text);
  const decipher = createDecipheriv("aes-256-gcm", hashKey(), Buffer.from(o.iv, "base64"));
  decipher.setAuthTag(Buffer.from(o.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(o.d, "base64")), decipher.final()]).toString("utf8");
}

function load(): Record<string, ConnectorAuth> {
  if (!fs.existsSync(storeFile())) return {};
  try {
    const raw = fs.readFileSync(storeFile(), "utf8");
    return JSON.parse(raw.startsWith("{") && raw.includes('"iv"') ? decrypt(raw) : raw);
  } catch { return {}; }
}

function save(data: Record<string, ConnectorAuth>): void {
  fs.mkdirSync(resolveStoreDir(), {recursive: true});
  fs.writeFileSync(storeFile(), encrypt(JSON.stringify(data, null, 2)), {encoding: "utf8", mode: 0o600});
}

export function getConnector(id: string): ConnectorAuth | undefined { return load()[`connector:${id}`]; }
export function setConnector(id: string, auth: ConnectorAuth): void { const data = load(); data[`connector:${id}`] = auth; save(data); }
export function removeConnector(id: string): void { const data = load(); delete data[`connector:${id}`]; save(data); }
export function listAuth(): Record<string, ConnectorAuth> { return load(); }
