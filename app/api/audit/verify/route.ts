import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { verifyChain } from "@/lib/audit-chain";
import type { ChainedAuditEvent } from "@/lib/audit-chain";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(auditEvents)
    .orderBy(asc(auditEvents.sequenceNumber));

  const chain: ChainedAuditEvent[] = rows.map((row) => ({
    id: row.id,
    sequenceNumber: row.sequenceNumber,
    timestamp: row.timestamp,
    actor: row.actor,
    action: row.action,
    targetType: row.targetType as ChainedAuditEvent["targetType"],
    targetId: row.targetId,
    beforeStatus: row.beforeStatus,
    afterStatus: row.afterStatus,
    note: row.note,
    chainHash: row.chainHash,
    previousHash: row.previousHash,
  }));

  const { valid, firstBrokenAt } = await verifyChain(chain);

  return NextResponse.json({ valid, totalEvents: chain.length, firstBrokenAt });
}