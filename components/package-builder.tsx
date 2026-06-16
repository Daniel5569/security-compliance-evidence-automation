"use client";

import type { EvidenceItem, FrameworkId, FrameworkView, PackageEvaluation } from "@/lib/compliance-types";
import { formatPercent } from "@/lib/formatters";
import { StatusBadge } from "./status-badge";

interface PackageBuilderProps {
  frameworks: FrameworkView[];
  selectedFrameworkId: FrameworkId;
  evaluation: PackageEvaluation;
  includedEvidence: EvidenceItem[];
  excludedEvidence: EvidenceItem[];
  packageStatus: "draft" | "generated";
  onSelectFramework: (frameworkId: FrameworkId) => void;
  onGeneratePackage: () => void;
}

export function PackageBuilder({
  frameworks,
  selectedFrameworkId,
  evaluation,
  includedEvidence,
  excludedEvidence,
  packageStatus,
  onSelectFramework,
  onGeneratePackage
}: PackageBuilderProps) {
  return (
    <section className="panel package-panel">
      <div className="panel-heading">
        <div>
          <h2>Package builder</h2>
          <p>Customer security review export preview</p>
        </div>
        <StatusBadge status={evaluation.status} />
      </div>
      <div className="segmented">
        {frameworks.map((framework) => (
          <button
            className={framework.id === selectedFrameworkId ? "active" : ""}
            key={framework.id}
            onClick={() => onSelectFramework(framework.id)}
            type="button"
          >
            {framework.name}
          </button>
        ))}
      </div>
      <div className="package-summary">
        <div>
          <label>Readiness</label>
          <strong>{formatPercent(evaluation.readinessScore)}</strong>
        </div>
        <div>
          <label>High gaps</label>
          <strong>{evaluation.highGapCount}</strong>
        </div>
        <div>
          <label>Pending reviews</label>
          <strong>{evaluation.pendingReviewCount}</strong>
        </div>
        <div>
          <label>Redaction</label>
          <StatusBadge status={evaluation.redactionStatus} />
        </div>
      </div>
      <div className="package-columns">
        <div>
          <h3>Included</h3>
          {includedEvidence.slice(0, 8).map((item) => (
            <p key={item.id}>{item.id} · {item.title}</p>
          ))}
        </div>
        <div>
          <h3>Excluded</h3>
          {excludedEvidence.slice(0, 8).map((item) => (
            <p key={item.id}>{item.id} · {item.status}</p>
          ))}
        </div>
      </div>
      <div className="package-footer">
        <span>Package status: {packageStatus}</span>
        <button onClick={onGeneratePackage} type="button">Generate package</button>
      </div>
    </section>
  );
}
