import { describe, expect, it } from "vitest";
import {
  calculateControlReadiness,
  calculateFrameworkReadiness,
  detectGaps,
  evaluatePackageReadiness,
  isEvidenceExpired,
  transitionEvidence
} from "@/lib/compliance-engine";
import type { Control, EvidenceItem } from "@/lib/compliance-types";

const asOf = "2026-06-13T09:00:00.000Z";

const control: Control = {
  id: "AC-TEST",
  domain: "Access control",
  frameworkIds: ["soc2"],
  owner: "Maya Chen",
  criticality: "critical",
  objective: "Access is reviewed.",
  requirements: ["Access review", "MFA policy"],
  reviewerNotes: "Synthetic review.",
  lastReviewed: "2026-06-01"
};

const approvedEvidence: EvidenceItem = {
  id: "EVD-TEST-1",
  title: "Access review",
  controlIds: ["AC-TEST"],
  frameworkIds: ["soc2"],
  owner: "Maya Chen",
  sourceType: "Report",
  collectedDate: "2026-06-01",
  freshnessDays: 90,
  sensitivity: "internal",
  status: "approved",
  risk: "low",
  dueDate: "2026-06-20",
  excerpt: "Synthetic access review.",
  summary: "Approved synthetic summary.",
  riskNotes: "No live identifiers.",
  missingFields: []
};

const secondApprovedEvidence: EvidenceItem = {
  ...approvedEvidence,
  id: "EVD-TEST-2",
  title: "MFA policy"
};

describe("compliance engine", () => {
  it("marks a control ready when required evidence is approved and fresh", () => {
    const readiness = calculateControlReadiness(control, [approvedEvidence, secondApprovedEvidence], asOf);

    expect(readiness.status).toBe("ready");
    expect(readiness.readinessScore).toBe(100);
    expect(readiness.approvedEvidenceCount).toBe(2);
  });

  it("detects evidence expiration using freshness windows", () => {
    const staleEvidence = {
      ...approvedEvidence,
      collectedDate: "2025-12-01",
      freshnessDays: 90
    };

    expect(isEvidenceExpired(staleEvidence, asOf)).toBe(true);
  });

  it("creates high gaps for critical controls with no approved evidence", () => {
    const rejectedEvidence: EvidenceItem = {
      ...approvedEvidence,
      status: "rejected"
    };

    const gaps = detectGaps([control], [rejectedEvidence], asOf);

    expect(gaps.some((gap) => gap.severity === "high" && gap.reason === "missing evidence")).toBe(true);
    expect(gaps.some((gap) => gap.reason === "rejected")).toBe(true);
  });

  it("evaluates package readiness from readiness, high gaps, and pending reviews", () => {
    const evaluation = evaluatePackageReadiness("soc2", [control], [approvedEvidence, secondApprovedEvidence], asOf);

    expect(evaluation.status).toBe("ready");
    expect(evaluation.readinessScore).toBe(100);
    expect(evaluation.highGapCount).toBe(0);
  });

  it("keeps package not ready when pending reviews and high gaps remain", () => {
    const pendingEvidence: EvidenceItem = {
      ...secondApprovedEvidence,
      status: "in_review"
    };
    const frameworkReadiness = calculateFrameworkReadiness("soc2", [control], [approvedEvidence, pendingEvidence], asOf);
    const evaluation = evaluatePackageReadiness("soc2", [control], [approvedEvidence, pendingEvidence], asOf);

    expect(frameworkReadiness.readinessScore).toBe(50);
    expect(evaluation.status).toBe("not_ready");
  });

  it("updates evidence state and emits an audit event for reviewer actions", () => {
    const { updatedEvidence, auditEvent } = transitionEvidence(
      { ...approvedEvidence, status: "in_review" },
      "approve",
      "Avery Stone",
      "Looks complete.",
      asOf
    );

    expect(updatedEvidence.status).toBe("approved");
    expect(auditEvent.beforeStatus).toBe("in_review");
    expect(auditEvent.afterStatus).toBe("approved");
    expect(auditEvent.note).toBe("Looks complete.");
  });
});
