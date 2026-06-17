/**
 * Manual end-to-end tamper-detection test.
 *
 * Usage (requires .env with DATABASE_URL and a running dev server):
 *   node --env-file=.env ./node_modules/.bin/tsx scripts/tamper-and-verify.ts
 *
 * What it does:
 *  1. Reads the current chain from Neon.
 *  2. Corrupts the chain_hash of the first event directly in the DB
 *     (bypassing all API routes — raw SQL via Drizzle).
 *  3. Calls GET /api/audit/verify and prints the response.
 *  4. Restores the original chain_hash.
 *  5. Calls GET /api/audit/verify again to confirm the chain is clean.
 */

import { asc, eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { auditEvents } from "../lib/db/schema";

const PORT = process.env.PORT ?? "3000";
const VERIFY_URL = `http://localhost:${PORT}/api/audit/verify`;
const TAMPERED_HASH = "deadbeef" + "0".repeat(56);

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema: { auditEvents } });

async function verifyViaHttp(): Promise<{ valid: boolean; totalEvents: number; firstBrokenAt: number | null }> {
  const resp = await fetch(VERIFY_URL);
  return resp.json() as Promise<{ valid: boolean; totalEvents: number; firstBrokenAt: number | null }>;
}

async function main() {
  const rows = await db.select().from(auditEvents).orderBy(asc(auditEvents.sequenceNumber));

  if (rows.length === 0) {
    console.error("No events found in DB. POST at least one reviewer action via the UI first.");
    process.exit(1);
  }

  // ── Baseline ────────────────────────────────────────────────────────────────
  const baseline = await verifyViaHttp();
  console.log("── Baseline (no tamper) ──────────────────────────────────");
  console.log(JSON.stringify(baseline, null, 2));

  if (!baseline.valid) {
    console.error("Chain is already broken before the test. Aborting.");
    process.exit(1);
  }

  // ── Tamper ──────────────────────────────────────────────────────────────────
  const target = rows[0]; // event at sequence_number = 1
  const originalHash = target.chainHash;

  console.log(`\n── Tampering event #${target.sequenceNumber} (${target.id}) directly in DB ──`);
  console.log(`   original chain_hash : ${originalHash}`);
  console.log(`   tampered chain_hash : ${TAMPERED_HASH}`);

  await db
    .update(auditEvents)
    .set({ chainHash: TAMPERED_HASH })
    .where(eq(auditEvents.id, target.id));

  // ── Verify via HTTP endpoint ─────────────────────────────────────────────────
  const afterTamper = await verifyViaHttp();
  console.log("\n── GET /api/audit/verify after DB tamper ─────────────────");
  console.log(JSON.stringify(afterTamper, null, 2));
  console.log(
    afterTamper.valid === false && afterTamper.firstBrokenAt === target.sequenceNumber
      ? "✓  PASS — endpoint detected tamper at correct sequence number"
      : "✗  FAIL — unexpected result"
  );

  // ── Restore ─────────────────────────────────────────────────────────────────
  await db
    .update(auditEvents)
    .set({ chainHash: originalHash })
    .where(eq(auditEvents.id, target.id));

  console.log(`\n── Restored original chain_hash for event #${target.sequenceNumber} ──`);

  const afterRestore = await verifyViaHttp();
  console.log("\n── GET /api/audit/verify after restore ────────────────────");
  console.log(JSON.stringify(afterRestore, null, 2));
  console.log(
    afterRestore.valid === true
      ? "✓  PASS — chain valid again after restore"
      : "✗  FAIL — chain still broken after restore"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
