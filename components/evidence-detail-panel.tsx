"use client";

import type { EvidenceItem, ReviewerAction } from "@/lib/compliance-types";
import { getEffectiveEvidenceStatus } from "@/lib/compliance-engine";
import { formatDate } from "@/lib/formatters";
import { StatusBadge } from "./status-badge";

interface EvidenceDetailPanelProps {
  asOf: string;
  evidence: EvidenceItem | undefined;
  reviewerNote: string;
  onReviewerNoteChange: (note: string) => void;
  onReviewerAction: (action: ReviewerAction) => void;
}

const actionLabels: Array<{ action: ReviewerAction; label: string }> = [
  { action: "approve", label: "Approve" },
  { action: "request_changes", label: "Request changes" },
  { action: "reject", label: "Reject" },
  { action: "mark_expired", label: "Mark expired" }
];

export function EvidenceDetailPanel({
  asOf,
  evidence,
  reviewerNote,
  onReviewerNoteChange,
  onReviewerAction
}: EvidenceDetailPanelProps) {
  if (!evidence) {
    return (
      <aside className="panel detail-panel">
        <h2>Evidence detail</h2>
        <p>Select evidence from the queue.</p>
      </aside>
    );
  }

  const effectiveStatus = getEffectiveEvidenceStatus(evidence, asOf);

  return (
    <aside className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <h2>{evidence.id}</h2>
          <p>{evidence.title}</p>
        </div>
        <StatusBadge status={effectiveStatus} />
      </div>
      <div className="detail-stack">
        <div className="meta-grid">
          <div>
            <label>Source</label>
            <strong>{evidence.sourceType}</strong>
          </div>
          <div>
            <label>Owner</label>
            <strong>{evidence.owner}</strong>
          </div>
          <div>
            <label>Collected</label>
            <strong>{formatDate(evidence.collectedDate)}</strong>
          </div>
          <div>
            <label>Sensitivity</label>
            <strong>{evidence.sensitivity}</strong>
          </div>
          <div>
            <label>Linked controls</label>
            <strong>{evidence.controlIds.join(", ")}</strong>
          </div>
          <div>
            <label>Freshness window</label>
            <strong>{evidence.freshnessDays} days</strong>
          </div>
        </div>
        <div>
          <label>Preview</label>
          <p>{evidence.excerpt}</p>
        </div>
        <div>
          <label>Generated summary</label>
          <p>{evidence.summary}</p>
        </div>
        <div>
          <label>Risk notes</label>
          <p>{evidence.riskNotes}</p>
        </div>
        <div>
          <label>Missing fields</label>
          <p>{evidence.missingFields.length > 0 ? evidence.missingFields.join(", ") : "None"}</p>
        </div>
        <div className="review-box">
          <label htmlFor="reviewer-note">Reviewer note</label>
          <textarea
            id="reviewer-note"
            onChange={(event) => onReviewerNoteChange(event.target.value)}
            placeholder="Add decision context"
            value={reviewerNote}
          />
          <div className="action-grid">
            {actionLabels.map((item) => (
              <button key={item.action} onClick={() => onReviewerAction(item.action)} type="button">
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
