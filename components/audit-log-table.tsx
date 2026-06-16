"use client";

import { useEffect, useState } from "react";
import { buildChain, shortHash, verifyChain } from "@/lib/audit-chain";
import type { ChainedAuditEvent } from "@/lib/audit-chain";
import type { AuditEvent } from "@/lib/compliance-types";
import { formatDate } from "@/lib/formatters";

export function AuditLogTable({ events }: { events: AuditEvent[] }) {
  const [chain, setChain] = useState<ChainedAuditEvent[]>([]);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function compute() {
      const sorted = [...events].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const built = await buildChain(sorted);
      const { valid } = await verifyChain(built);

      if (!cancelled) {
        setChain(built);
        setChainValid(valid);
      }
    }

    compute();
    return () => { cancelled = true; };
  }, [events]);

  const displayed = showAll ? chain : chain.slice(-12);

  return (
    <section className="panel audit-panel">
      <div className="panel-heading">
        <div>
          <h2>Audit log</h2>
          <p>{events.length} traceable events</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {chainValid !== null && (
            <span
              className={`chain-badge ${chainValid ? "chain-valid" : "chain-invalid"}`}
              title={chainValid ? "All hash links verified" : "Chain integrity check failed"}
            >
              {chainValid ? "✓ Chain verified" : "✗ Chain broken"}
            </span>
          )}
          {chain.length > 12 && (
            <button
              className="btn-ghost"
              onClick={() => setShowAll((prev) => !prev)}
              type="button"
            >
              {showAll ? "Show recent" : `Show all ${chain.length}`}
            </button>
          )}
        </div>
      </div>
      <div className="table-wrap compact-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Status change</th>
              <th title="SHA-256 of event payload + previous hash">Hash</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((event) => (
              <tr key={event.id}>
                <td className="mono dim">{event.sequenceNumber}</td>
                <td>{formatDate(event.timestamp)}</td>
                <td>{event.actor}</td>
                <td>{event.action}</td>
                <td>{event.targetId}</td>
                <td>{event.beforeStatus} → {event.afterStatus}</td>
                <td
                  className="mono dim"
                  title={`${event.chainHash}\n← prev: ${event.previousHash}`}
                >
                  {shortHash(event.chainHash)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {chain.length === 0 && (
        <p className="empty-state">Computing chain hashes…</p>
      )}
    </section>
  );
}
