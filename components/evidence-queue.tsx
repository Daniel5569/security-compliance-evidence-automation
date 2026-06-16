"use client";

import type { EvidenceItem } from "@/lib/compliance-types";
import { getEffectiveEvidenceStatus } from "@/lib/compliance-engine";
import { formatDate } from "@/lib/formatters";
import { StatusBadge } from "./status-badge";

interface EvidenceQueueProps {
  asOf: string;
  evidenceItems: EvidenceItem[];
  selectedEvidenceId: string;
  onSelectEvidence: (evidenceId: string) => void;
}

export function EvidenceQueue({ asOf, evidenceItems, selectedEvidenceId, onSelectEvidence }: EvidenceQueueProps) {
  return (
    <section className="panel evidence-panel">
      <div className="panel-heading">
        <div>
          <h2>Evidence queue</h2>
          <p>{evidenceItems.length} items in the current view</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Evidence</th>
              <th>Control</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Freshness</th>
              <th>Risk</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {evidenceItems.map((item) => {
              const effectiveStatus = getEffectiveEvidenceStatus(item, asOf);
              return (
                <tr
                  className={item.id === selectedEvidenceId ? "selected-row" : ""}
                  key={item.id}
                  onClick={() => onSelectEvidence(item.id)}
                >
                  <td>
                    <strong>{item.id}</strong>
                    <span>{item.title}</span>
                  </td>
                  <td>{item.controlIds.join(", ")}</td>
                  <td>{item.owner}</td>
                  <td>
                    <StatusBadge status={effectiveStatus} />
                  </td>
                  <td>{formatDate(item.collectedDate)}</td>
                  <td className={`risk risk-${item.risk}`}>{item.risk}</td>
                  <td>{formatDate(item.dueDate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
