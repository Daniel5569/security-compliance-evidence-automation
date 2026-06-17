/**
 * Integration test: direct DB tamper detection via verifyChain.
 *
 * Tests the same logic executed by GET /api/audit/verify:
 *   db.select(audit_events ordered by sequence_number) → verifyChain()
 *
 * Run with:
 *   npm run test:integration
 *
 * Skipped automatically when DATABASE_URL is not set (CI, fresh clone).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuditEvent } from "@/lib/compliance-types";
import type { ChainedAuditEvent } from "@/lib/audit-chain";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("audit chain DB tamper detection (integration)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let auditEventsTable: any;
  let appendEvent: (event: AuditEvent, previousHash: string, sequenceNumber: number) => Promise<ChainedAuditEvent>;
  let verifyChain: (chain: ChainedAuditEvent[]) => Promise<{ valid: boolean; firstBrokenAt: number | null }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let drizzleOps: any;

  const GENESIS_HASH = "0".repeat(64);
  const TAMPERED_HASH = "deadbeef" + "0".repeat(56);
  const TEST_ID_PREFIX = "AUD-INT-TEST-TAMPER";

  beforeAll(async () => {
    ({ db } = await import("@/lib/db"));
    ({ auditEvents: auditEventsTable } = await import("@/lib/db/schema"));
    ({ appendEvent, verifyChain } = await import("@/lib/audit-chain"));
    drizzleOps = await import("drizzle-orm");
  });

  afterAll(async () => {
    if (!db) return;
    const { like } = await import("drizzle-orm");
    await db.delete(auditEventsTable).where(like(auditEventsTable.id, `${TEST_ID_PREFIX}%`));
  });

  function toChain(rows: ChainedAuditEvent[]): ChainedAuditEvent[] {
    return rows.map((row) => ({
      id: row.id,
      sequenceNumber: row.sequenceNumber,
      timestamp: row.timestamp,
      actor: row.actor,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      beforeStatus: row.beforeStatus,
      afterStatus: row.afterStatus,
      note: row.note,
      chainHash: row.chainHash,
      previousHash: row.previousHash,
    }));
  }

  async function fetchAllOrdered(): Promise<ChainedAuditEvent[]> {
    const rows = await db
      .select()
      .from(auditEventsTable)
      .orderBy(drizzleOps.asc(auditEventsTable.sequenceNumber));
    return toChain(rows);
  }

  async function getTail(): Promise<{ sequenceNumber: number; chainHash: string }> {
    const [row] = await db
      .select({ sequenceNumber: auditEventsTable.sequenceNumber, chainHash: auditEventsTable.chainHash })
      .from(auditEventsTable)
      .orderBy(drizzleOps.desc(auditEventsTable.sequenceNumber))
      .limit(1);
    return row ?? { sequenceNumber: 0, chainHash: GENESIS_HASH };
  }

  it("chain is valid before any tamper", async () => {
    const rows = await fetchAllOrdered();
    const { valid } = await verifyChain(rows);
    expect(valid).toBe(true);
  });

  it("detects a tampered chain_hash written directly to DB (bypassing API routes)", async () => {
    const tail = await getTail();
    const nextSeq = tail.sequenceNumber + 1;

    const testEvent: AuditEvent = {
      id: `${TEST_ID_PREFIX}-HASH-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Integration Test",
      action: "tamper-test-chain-hash",
      targetType: "evidence",
      targetId: "EVD-INT-001",
      beforeStatus: "in_review",
      afterStatus: "approved",
      note: "Inserted by audit-tamper.integration.test.ts with tampered chain_hash.",
    };

    const chained = await appendEvent(testEvent, tail.chainHash, nextSeq);

    // Insert with deliberately wrong chain_hash — simulates a DB-level edit that
    // bypasses the API route and its hash computation.
    await db.insert(auditEventsTable).values({
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
      chainHash: TAMPERED_HASH,            // <-- deliberate tamper
      previousHash: chained.previousHash,
    });

    try {
      // Run the same logic as GET /api/audit/verify
      const rows = await fetchAllOrdered();
      const { valid, firstBrokenAt } = await verifyChain(rows);

      expect(valid).toBe(false);
      expect(firstBrokenAt).toBe(nextSeq);
    } finally {
      await db.delete(auditEventsTable).where(drizzleOps.eq(auditEventsTable.id, testEvent.id));
    }
  });

  it("chain is valid again after removing the tampered row", async () => {
    const rows = await fetchAllOrdered();
    const { valid, firstBrokenAt } = await verifyChain(rows);
    expect(valid).toBe(true);
    expect(firstBrokenAt).toBeNull();
  });

  it("detects a tampered previous_hash pointer written directly to DB", async () => {
    const tail = await getTail();
    const nextSeq = tail.sequenceNumber + 1;

    const testEvent: AuditEvent = {
      id: `${TEST_ID_PREFIX}-PTR-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Integration Test",
      action: "tamper-test-prev-hash",
      targetType: "evidence",
      targetId: "EVD-INT-002",
      beforeStatus: "missing",
      afterStatus: "collected",
      note: "Inserted by audit-tamper.integration.test.ts with tampered previous_hash.",
    };

    const chained = await appendEvent(testEvent, tail.chainHash, nextSeq);

    await db.insert(auditEventsTable).values({
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
      previousHash: "cafebabe" + "0".repeat(56),  // <-- tampered pointer
    });

    try {
      const rows = await fetchAllOrdered();
      const { valid, firstBrokenAt } = await verifyChain(rows);

      expect(valid).toBe(false);
      expect(firstBrokenAt).toBe(nextSeq);
    } finally {
      await db.delete(auditEventsTable).where(drizzleOps.eq(auditEventsTable.id, testEvent.id));
    }
  });
});
