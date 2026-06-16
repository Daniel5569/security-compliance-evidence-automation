export type FrameworkId = "soc2" | "iso27001" | "customer-review";

export type EvidenceStatus =
  | "missing"
  | "collected"
  | "in_review"
  | "approved"
  | "needs_changes"
  | "rejected"
  | "expired";

export type ControlStatus = "ready" | "partial" | "blocked" | "needs_review";

export type GapSeverity = "high" | "medium" | "low";

export type ReviewerAction =
  | "approve"
  | "request_changes"
  | "reject"
  | "mark_expired"
  | "link_control";

export interface FrameworkView {
  id: FrameworkId;
  name: string;
  description: string;
}

export interface Control {
  id: string;
  domain: string;
  frameworkIds: FrameworkId[];
  owner: string;
  criticality: "critical" | "standard";
  objective: string;
  requirements: string[];
  reviewerNotes: string;
  lastReviewed: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  controlIds: string[];
  frameworkIds: FrameworkId[];
  owner: string;
  sourceType: string;
  collectedDate: string | null;
  freshnessDays: number;
  sensitivity: "public" | "internal" | "confidential" | "restricted";
  status: EvidenceStatus;
  risk: "low" | "medium" | "high";
  dueDate: string;
  excerpt: string;
  summary: string;
  riskNotes: string;
  missingFields: string[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetType: "control" | "evidence" | "package";
  targetId: string;
  beforeStatus: string;
  afterStatus: string;
  note: string;
}

export interface ControlReadiness {
  controlId: string;
  status: ControlStatus;
  requiredEvidenceCount: number;
  approvedEvidenceCount: number;
  inReviewCount: number;
  expiredCount: number;
  missingCount: number;
  readinessScore: number;
}

export interface Gap {
  id: string;
  controlId: string;
  frameworkIds: FrameworkId[];
  owner: string;
  severity: GapSeverity;
  reason:
    | "missing evidence"
    | "expired evidence"
    | "no owner"
    | "needs review"
    | "rejected";
  impact: string;
  nextAction: string;
  dueDate: string;
}

export interface PackageEvaluation {
  frameworkId: FrameworkId;
  readinessScore: number;
  highGapCount: number;
  pendingReviewCount: number;
  includedEvidenceCount: number;
  excludedEvidenceCount: number;
  redactionStatus: "ready" | "review_needed";
  status: "ready" | "not_ready";
}
