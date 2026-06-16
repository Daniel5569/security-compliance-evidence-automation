"use client";

import type { EvidenceItem, FrameworkView, ReviewerAction } from "@/lib/compliance-types";
import { formatPercent } from "@/lib/formatters";
import { EvidenceDetailPanel } from "./evidence-detail-panel";
import { EvidenceQueue } from "./evidence-queue";

interface ComplianceDashboardProps {
  asOf: string;
  frameworks: FrameworkView[];
  frameworkScores: Array<{ frameworkId: string; readinessScore: number; controlsTotal: number; readyControls: number }>;
  filteredEvidence: EvidenceItem[];
  selectedEvidence: EvidenceItem | undefined;
  selectedEvidenceId: string;
  reviewerNote: string;
  onReviewerNoteChange: (note: string) => void;
  onReviewerAction: (action: ReviewerAction) => void;
  onSelectEvidence: (evidenceId: string) => void;
  gapPanel: React.ReactNode;
}

export function ComplianceDashboard({
  asOf,
  frameworks,
  frameworkScores,
  filteredEvidence,
  selectedEvidence,
  selectedEvidenceId,
  reviewerNote,
  onReviewerNoteChange,
  onReviewerAction,
  onSelectEvidence,
  gapPanel
}: ComplianceDashboardProps) {
  return (
    <div className="dashboard-grid">
      <section className="panel readiness-panel">
        <div className="panel-heading">
          <div>
            <h2>Readiness by view</h2>
            <p>Framework and customer review posture</p>
          </div>
        </div>
        <div className="readiness-list">
          {frameworkScores.map((score) => {
            const framework = frameworks.find((item) => item.id === score.frameworkId);
            return (
              <div className="progress-row" key={score.frameworkId}>
                <div>
                  <strong>{framework?.name}</strong>
                  <span>
                    {score.readyControls}/{score.controlsTotal} controls ready
                  </span>
                </div>
                <div className="progress-track" aria-label={`${framework?.name} readiness`}>
                  <span style={{ width: `${score.readinessScore}%` }} />
                </div>
                <b>{formatPercent(score.readinessScore)}</b>
              </div>
            );
          })}
        </div>
      </section>
      {gapPanel}
      <EvidenceQueue
        asOf={asOf}
        evidenceItems={filteredEvidence}
        onSelectEvidence={onSelectEvidence}
        selectedEvidenceId={selectedEvidenceId}
      />
      <EvidenceDetailPanel
        asOf={asOf}
        evidence={selectedEvidence}
        onReviewerAction={onReviewerAction}
        onReviewerNoteChange={onReviewerNoteChange}
        reviewerNote={reviewerNote}
      />
    </div>
  );
}
