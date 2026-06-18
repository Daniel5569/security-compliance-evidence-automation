import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { appendEvent } from "@/lib/audit-chain";
import type { AuditEvent } from "@/lib/compliance-types";

export const dynamic = "force-dynamic";

const GENESIS_HASH = "0".repeat(64);

export async function POST(req: NextRequest) {
  const event = (await req.json()) as AuditEvent;

  const [last] = await db
    .select({ sequenceNumber: auditEvents.sequenceNumber, chainHash: auditEvents.chainHash })
    .from(auditEvents)
    .orderBy(desc(auditEvents.sequenceNumber))
    .limit(1);

  const previousHash = last?.chainHash ?? GENESIS_HASH;
  const sequenceNumber = (last?.sequenceNumber ?? 0) + 1;

  const chained = await appendEvent(event, previousHash, sequenceNumber);

  await db.insert(auditEvents).values({
    id: chained.id,
    sequenceNumber: chained.sequenceNumber,
    timestamp: chained.timestamp,
    actor: chained.actor,
    action: chained.action,
    targetType: chained.targetType,
    targetId: chained.targetId,
    beforeStatus: chained.beforeStatus,
    afterStatus: chained.afterStatus,
    note: chained.note,
    chainHash: chained.chainHash,
    previousHash: chained.previousHash,
  });

  return NextResponse.json(chained, { status: 201 });
}