import {createHash} from "crypto";
import type {CanonicalRecord} from "@/lib/runtimeStore";

type ProviderPayload = Record<string, unknown>;
const collections: Record<CanonicalRecord["type"], string[]> = {
  order: ["orders", "order", "sales"],
  product: ["products", "product", "listings", "catalog"],
  customer: ["customers", "customer", "users", "profiles"],
  inventory: ["inventory", "inventories", "stock", "stocks"],
  payment: ["payments", "payment", "charges", "transactions"],
  shipment: ["shipments", "shipment", "fulfillments", "deliveries"],
  event: ["events", "event", "webhooks"],
};

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 24);
}
function sourceId(item: Record<string, unknown>) {
  for (const key of ["id", "_id", "uuid", "order_id", "orderId", "product_id", "customer_id", "email"]) {
    if (item[key] !== undefined && item[key] !== null) return String(item[key]);
  }
  return digest(item);
}
function asItems(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((v): v is Record<string, unknown> => Boolean(v && typeof v === "object"));
  if (value && typeof value === "object") {
    const record = value as ProviderPayload;
    for (const key of ["nodes", "data", "items", "results", "records"]) if (Array.isArray(record[key])) return asItems(record[key]);
  }
  return [];
}
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined).map(([k, v]) => [k, clean(v)]));
  return value;
}

export function normalizeProviderPayload(workspaceId: string, provider: string, payload: unknown): CanonicalRecord[] {
  const raw = payload && typeof payload === "object" ? payload as ProviderPayload : {};
  const root = raw.data && typeof raw.data === "object" ? {...raw, ...(raw.data as ProviderPayload)} : raw;
  const records: CanonicalRecord[] = [];
  const seen = new Set<string>();
  for (const [type, names] of Object.entries(collections) as [CanonicalRecord["type"], string[]][]) {
    for (const name of names) {
      const items = asItems(root[name]);
      for (const item of items) {
        const id = sourceId(item);
        const key = `${provider}:${type}:${id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        records.push({ id: key, workspaceId, provider, sourceId: id, type, data: clean(item) as Record<string, unknown>, syncedAt: Date.now() });
      }
    }
  }
  return records;
}

export function summarizeRecords(records: CanonicalRecord[]) {
  return records.reduce<Record<string, number>>((summary, record) => { summary[record.type] = (summary[record.type] || 0) + 1; return summary; }, {});
}
