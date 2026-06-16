import { describe, expect, it } from "vitest";
import { buildChain, verifyChain } from "@/lib/audit-chain";
import type { AuditEvent } from "@/lib/compliance-types";

const events: AuditEvent[] = [
  {
    id: "AUD-001",
    timestamp: "2026-06-10T10:00:00.000Z",
    actor: "Maya Chen",
    action: "evidence collected",
    targetType: "evidence",
    targetId: "EVD-001",
    beforeStatus: "missing",
    afterStatus: "collected",
    note: "Synthetic test event."
  },
  {
    id: "AUD-002",
    timestamp: "2026-06-11T09:00:00.000Z",
    actor: "Jordan Ellis",
    action: "evidence approved",
    targetType: "evidence",
    targetId: "EVD-001",
    beforeStatus: "in_review",
    afterStatus: "approved",
    note: "Synthetic test event."
  },
  {
    id: "AUD-003",
    timestamp: "2026-06-12T14:00:00.000Z",
    actor: "Priya Raman",
    action: "package generated",
    targetType: "package",
    targetId: "PKG-SOC2",
    beforeStatus: "draft",
    afterStatus: "generated",
    note: "Synthetic test event."
  }
];

describe("audit chain", () => {
  it("builds a hash chain where each event references the previous hash", async () => {
    const chain = await buildChain(events);

    expect(chain).toHaveLength(3);
    expect(chain[0].previousHash).toBe("0".repeat(64));
    expect(chain[1].previousHash).toBe(chain[0].chainHash);
    expect(chain[2].previousHash).toBe(chain[1].chainHash);
  });

  it("assigns sequential sequence numbers", async () => {
    const chain = await buildChain(events);

    expect(chain[0].sequenceNumber).toBe(1);
    expect(chain[1].sequenceNumber).toBe(2);
    expect(chain[2].sequenceNumber).toBe(3);
  });

  it("verifies a clean chain as valid", async () => {
    const chain = await buildChain(events);
    const { valid, firstBrokenAt } = await verifyChain(chain);

    expect(valid).toBe(true);
    expect(firstBrokenAt).toBeNull();
  });

  it("detects tampering when a chain hash is altered", async () => {
    const chain = await buildChain(events);
    const tampered = [...chain];
    tampered[1] = { ...tampered[1], chainHash: "deadbeef" + "0".repeat(56) };

    const { valid, firstBrokenAt } = await verifyChain(tampered);

    expect(valid).toBe(false);
    expect(firstBrokenAt).toBe(2);
  });

  it("detects tampering when a previous-hash pointer is altered", async () => {
    const chain = await buildChain(events);
    const tampered = [...chain];
    tampered[2] = { ...tampered[2], previousHash: "cafebabe" + "0".repeat(56) };

    const { valid, firstBrokenAt } = await verifyChain(tampered);

    expect(valid).toBe(false);
    expect(firstBrokenAt).toBe(3);
  });

  it("handles an empty event list", async () => {
    const chain = await buildChain([]);
    const { valid } = await verifyChain(chain);

    expect(chain).toHaveLength(0);
    expect(valid).toBe(true);
  });
});
