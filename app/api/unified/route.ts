import {NextResponse} from "next/server";
import {workspace,listRecords} from "@/lib/runtimeStore";
import {summarizeRecords} from "@/lib/unified";

export async function GET() {
  const owner = await workspace().catch(() => null);
  if (!owner) return NextResponse.json({error:"unauthorized"},{status:401});
  const records = await listRecords(owner);
  const byProvider = records.reduce<Record<string, number>>((out, record) => { out[record.provider] = (out[record.provider] || 0) + 1; return out; }, {});
  const latest = records.reduce<number | null>((value, record) => value === null ? record.syncedAt : Math.max(value, record.syncedAt), null);
  return NextResponse.json({ok:true,records,summary:{total:records.length,byType:summarizeRecords(records),byProvider,latestSyncedAt:latest}},{headers:{"cache-control":"no-store"}});
}
