import type {
  AuditEvent,
  Control,
  ControlReadiness,
  EvidenceItem,
  EvidenceStatus,
  FrameworkId,
  Gap,
  PackageEvaluation,
  ReviewerAction
} from "./compliance-types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isEvidenceExpired(evidence: EvidenceItem, asOf: string | Date) {
  if (!evidence.collectedDate || evidence.status === "missing") {
    return false;
  }

  if (evidence.status === "expired") {
    return true;
  }

  const collected = new Date(evidence.collectedDate).getTime();
  const current = new Date(asOf).getTime();
  return Math.floor((current - collected) / MS_PER_DAY) > evidence.freshnessDays;
}

export function getEffectiveEvidenceStatus(evidence: EvidenceItem, asOf: string | Date): EvidenceStatus {
  return isEvidenceExpired(evidence, asOf) ? "expired" : evidence.status;
}

export function calculateControlReadiness(
  control: Control,
  evidenceItems: EvidenceItem[],
  asOf: string | Date
): ControlReadiness {
  const linkedEvidence = evidenceItems.filter((item) => item.controlIds.includes(control.id));
  const requiredEvidenceCount = control.requirements.length;
  const approvedEvidenceCount = linkedEvidence.filter(
    (item) => getEffectiveEvidenceStatus(item, asOf) === "approved"
  ).length;
  const inReviewCount = linkedEvidence.filter(
    (item) => getEffectiveEvidenceStatus(item, asOf) === "in_review"
  ).length;
  const expiredCount = linkedEvidence.filter((item) => getEffectiveEvidenceStatus(item, asOf) === "expired").length;
  const rejectedCount = linkedEvidence.filter((item) => item.status === "rejected").length;
  const missingCount = Math.max(
    0,
    requiredEvidenceCount -
      linkedEvidence.filter((item) => getEffectiveEvidenceStatus(item, asOf) !== "missing").length
  );

  const readinessScore =
    requiredEvidenceCount === 0 ? 0 : Math.round((approvedEvidenceCount / requiredEvidenceCount) * 100);

  let status: ControlReadiness["status"] = "partial";
  if (approvedEvidenceCount >= requiredEvidenceCount && expiredCount === 0) {
    status = "ready";
  } else if (expiredCount > 0 || rejectedCount > 0 || missingCount > 0) {
    status = control.criticality === "critical" ? "blocked" : "partial";
  } else if (inReviewCount > 0) {
    status = "needs_review";
  }

  return {
    controlId: control.id,
    status,
    requiredEvidenceCount,
    approvedEvidenceCount,
    inReviewCount,
    expiredCount,
    missingCount,
    readinessScore
  };
}

export function calculateFrameworkReadiness(
  frameworkId: FrameworkId,
  controls: Control[],
  evidenceItems: EvidenceItem[],
  asOf: string | Date
) {
  const scopedControls = controls.filter((control) => control.frameworkIds.includes(frameworkId));
  const readiness = scopedControls.map((control) => calculateControlReadiness(control, evidenceItems, asOf));
  const readyControls = readiness.filter((item) => item.status === "ready").length;
  const totalScore = readiness.reduce((sum, item) => sum + item.readinessScore, 0);

  return {
    frameworkId,
    controlsTotal: scopedControls.length,
    readyControls,
    readinessScore: readiness.length === 0 ? 0 : Math.round(totalScore / readiness.length),
    readiness
  };
}

export function detectGaps(controls: Control[], evidenceItems: EvidenceItem[], asOf: string | Date): Gap[] {
  return controls.flatMap((control) => {
    const linkedEvidence = evidenceItems.filter((item) => item.controlIds.includes(control.id));
    const readiness = calculateControlReadiness(control, evidenceItems, asOf);
    const gaps: Gap[] = [];

    if (!control.owner) {
      gaps.push(createGap(control, "no owner", "No control owner is assigned.", "Assign an owner", "high"));
    }

    if (readiness.approvedEvidenceCount === 0) {
      gaps.push(
        createGap(
          control,
          "missing evidence",
          "No fresh approved evidence is available for this control.",
          "Collect or approve required evidence",
          control.criticality === "critical" ? "high" : "medium"
        )
      );
    }

    if (linkedEvidence.some((item) => getEffectiveEvidenceStatus(item, asOf) === "expired")) {
      gaps.push(
        createGap(
          control,
          "expired evidence",
          "One or more linked evidence items is past its freshness window.",
          "Refresh evidence and resubmit for review",
          control.criticality === "critical" ? "high" : "medium"
        )
      );
    }

    if (linkedEvidence.some((item) => getEffectiveEvidenceStatus(item, asOf) === "in_review" || item.status === "needs_changes")) {
      gaps.push(
        createGap(
          control,
          "needs review",
          "Evidence is waiting on a reviewer decision or owner update.",
          "Complete reviewer action",
          readiness.status === "blocked" ? "medium" : "low"
        )
      );
    }

    if (linkedEvidence.some((item) => item.status === "rejected")) {
      gaps.push(
        createGap(
          control,
          "rejected",
          "Rejected evidence cannot be included in readiness or customer packages.",
          "Replace rejected evidence with a scoped sample",
          control.criticality === "critical" ? "high" : "medium"
        )
      );
    }

    return gaps;
  });
}

export function evaluatePackageReadiness(
  frameworkId: FrameworkId,
  controls: Control[],
  evidenceItems: EvidenceItem[],
  asOf: string | Date
): PackageEvaluation {
  const frameworkReadiness = calculateFrameworkReadiness(frameworkId, controls, evidenceItems, asOf);
  const frameworkGaps = detectGaps(controls, evidenceItems, asOf).filter((gap) =>
    gap.frameworkIds.includes(frameworkId)
  );
  const scopedEvidence = evidenceItems.filter((item) => item.frameworkIds.includes(frameworkId));
  const includedEvidence = scopedEvidence.filter((item) => getEffectiveEvidenceStatus(item, asOf) === "approved");
  const pendingReviewCount = scopedEvidence.filter((item) =>
    ["in_review", "needs_changes", "collected"].includes(getEffectiveEvidenceStatus(item, asOf))
  ).length;
  const highGapCount = frameworkGaps.filter((gap) => gap.severity === "high").length;
  const redactionStatus = includedEvidence.some((item) => item.sensitivity === "restricted")
    ? "review_needed"
    : "ready";
  const status =
    frameworkReadiness.readinessScore >= 85 && highGapCount === 0 && pendingReviewCount <= 2
      ? "ready"
      : "not_ready";

  return {
    frameworkId,
    readinessScore: frameworkReadiness.readinessScore,
    highGapCount,
    pendingReviewCount,
    includedEvidenceCount: includedEvidence.length,
    excludedEvidenceCount: scopedEvidence.length - includedEvidence.length,
    redactionStatus,
    status
  };
}

export function transitionEvidence(
  evidence: EvidenceItem,
  action: ReviewerAction,
  actor: string,
  note: string,
  at = new Date().toISOString()
) {
  const nextStatusByAction: Record<ReviewerAction, EvidenceStatus> = {
    approve: "approved",
    request_changes: "needs_changes",
    reject: "rejected",
    mark_expired: "expired",
    link_control: evidence.status
  };

  const updatedEvidence: EvidenceItem = {
    ...evidence,
    status: nextStatusByAction[action],
    missingFields: action === "approve" ? [] : evidence.missingFields
  };

  const auditEvent: AuditEvent = {
    id: `AUD-${Date.now()}`,
    timestamp: at,
    actor,
    action,
    targetType: "evidence",
    targetId: evidence.id,
    beforeStatus: evidence.status,
    afterStatus: updatedEvidence.status,
    note
  };

  return { updatedEvidence, auditEvent };
}

function createGap(
  control: Control,
  reason: Gap["reason"],
  impact: string,
  nextAction: string,
  severity: Gap["severity"]
): Gap {
  return {
    id: `${control.id}-${reason.replaceAll(" ", "-")}`,
    controlId: control.id,
    frameworkIds: control.frameworkIds,
    owner: control.owner || "Unassigned",
    severity,
    reason,
    impact,
    nextAction,
    dueDate: "2026-06-24"
  };
}
