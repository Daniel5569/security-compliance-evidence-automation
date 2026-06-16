import type { AuditEvent } from "./compliance-types";

export interface ChainedAuditEvent extends AuditEvent {
  chainHash: string;
  previousHash: string;
  sequenceNumber: number;
}

const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function eventPayload(event: AuditEvent): string {
  return [event.id, event.timestamp, event.actor, event.action, event.targetId, event.beforeStatus, event.afterStatus].join("|");
}

export async function buildChain(events: AuditEvent[]): Promise<ChainedAuditEvent[]> {
  const chain: ChainedAuditEvent[] = [];
  let previousHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const payload = eventPayload(event) + "|" + previousHash;
    const chainHash = await sha256(payload);

    chain.push({ ...event, chainHash, previousHash, sequenceNumber: i + 1 });
    previousHash = chainHash;
  }

  return chain;
}

export async function verifyChain(chain: ChainedAuditEvent[]): Promise<{ valid: boolean; firstBrokenAt: number | null }> {
  let previousHash = GENESIS_HASH;

  for (let i = 0; i < chain.length; i++) {
    const event = chain[i];

    if (event.previousHash !== previousHash) {
      return { valid: false, firstBrokenAt: i + 1 };
    }

    const payload = eventPayload(event) + "|" + previousHash;
    const expectedHash = await sha256(payload);

    if (event.chainHash !== expectedHash) {
      return { valid: false, firstBrokenAt: i + 1 };
    }

    previousHash = event.chainHash;
  }

  return { valid: true, firstBrokenAt: null };
}

export function shortHash(hash: string): string {
  return hash.slice(0, 8) + "…";
}
