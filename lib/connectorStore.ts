import {createCipheriv, createDecipheriv, createHash, randomBytes} from "crypto";
import * as fs from "fs";
import * as path from "path";

export type ConnectorAuth = {
  accessToken: string;
  connectedAt: number;
  meta: string | null;
};

const dir = path.join(process.cwd(), ".flowos");
const file = path.join(dir, "connectors.json");
const secret = process.env.ENCRYPTION_KEY || "flowos-local-dev-key";

function hashKey(): Buffer {
  return createHash("sha256").update(secret).digest();
}

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
  try {
    if (!fs.existsSync(file)) return {};
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw.startsWith("{") && raw.includes('"iv"') ? decrypt(raw) : raw);
  } catch {
    return {};
  }
}

function save(data: Record<string, ConnectorAuth>): void {
  const text = JSON.stringify(data, null, 2);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(file, process.env.ENCRYPTION_KEY ? encrypt(text) : text, "utf8");
}

export function getConnector(id: string): ConnectorAuth | undefined {
  return load()[`connector:${id}`];
}

export function setConnector(id: string, auth: ConnectorAuth): void {
  const data = load();
  data[`connector:${id}`] = auth;
  save(data);
}

export function removeConnector(id: string): void {
  const data = load();
  delete data[`connector:${id}`];
  save(data);
}

export function listAuth(): Record<string, ConnectorAuth> {
  return load();
}