import { describe, expect, it } from "vitest";
import { appendEvent, buildChain, verifyChain } from "@/lib/audit-chain";
import type { AuditEvent } from "@/lib/compliance-types";

const GENESIS_HASH = "0".repeat(64);

const baseEvent: AuditEvent = {
  id: "AUD-100",
  timestamp: "2026-06-17T10:00:00.000Z",
  actor: "Avery Stone",
  action: "evidence approved",
  targetType: "evidence",
  targetId: "EVD-001",
  beforeStatus: "in_review",
  afterStatus: "approved",
  note: "Approved via reviewer workflow.",
};

describe("appendEvent — server-side chain append used by POST /api/audit", () => {
  it("returns a ChainedAuditEvent with genesis previousHash when DB is empty", async () => {
    const chained = await appendEvent(baseEvent, GENESIS_HASH, 1);

    expect(chained.previousHash).toBe(GENESIS_HASH);
    expect(chained.sequenceNumber).toBe(1);
    expect(chained.chainHash).toHaveLength(64);
    expect(chained.chainHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces a deterministic hash for the same payload", async () => {
    const first = await appendEvent(baseEvent, GENESIS_HASH, 1);
    const second = await appendEvent(baseEvent, GENESIS_HASH, 1);

    expect(first.chainHash).toBe(second.chainHash);
  });

  it("produces a different hash when previousHash differs", async () => {
    const withGenesis = await appendEvent(baseEvent, GENESIS_HASH, 1);
    const withDifferent = await appendEvent(baseEvent, "a".repeat(64), 1);

    expect(withGenesis.chainHash).not.toBe(withDifferent.chainHash);
  });

  it("correctly extends a chain built by buildChain and passes verifyChain", async () => {
    const priorEvent: AuditEvent = {
      id: "AUD-099",
      timestamp: "2026-06-17T09:00:00.000Z",
      actor: "Maya Chen",
      action: "evidence collected",
      targetType: "evidence",
      targetId: "EVD-001",
      beforeStatus: "missing",
      afterStatus: "collected",
      note: "",
    };

    const chain = await buildChain([priorEvent]);
    const appended = await appendEvent(baseEvent, chain[0].chainHash, 2);

    expect(appended.previousHash).toBe(chain[0].chainHash);

    const { valid } = await verifyChain([...chain, appended]);
    expect(valid).toBe(true);
  });

  it("a tampered chainHash in the appended event breaks verifyChain", async () => {
    const chain = await buildChain([
      { ...baseEvent, id: "AUD-099", timestamp: "2026-06-17T09:00:00.000Z" },
    ]);
    const appended = await appendEvent(baseEvent, chain[0].chainHash, 2);
    const tampered = { ...appended, chainHash: "deadbeef" + "0".repeat(56) };

    const { valid, firstBrokenAt } = await verifyChain([...chain, tampered]);
    expect(valid).toBe(false);
    expect(firstBrokenAt).toBe(2);
  });
});
