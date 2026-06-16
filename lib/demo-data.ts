import type {
  AuditEvent,
  Control,
  EvidenceItem,
  EvidenceStatus,
  FrameworkView
} from "./compliance-types";

export const asOfDate = "2026-06-13T09:00:00.000Z";

export const frameworks: FrameworkView[] = [
  {
    id: "soc2",
    name: "SOC 2 Readiness",
    description: "Controls for access, changes, incidents, vendors, and monitoring."
  },
  {
    id: "iso27001",
    name: "ISO 27001 Light Mapping",
    description: "A lightweight mapping across assets, risk, access, suppliers, and continuity."
  },
  {
    id: "customer-review",
    name: "Customer Security Review",
    description: "Evidence packaging for enterprise security questionnaires and due diligence."
  }
];

export const owners = [
  "Maya Chen",
  "Jordan Ellis",
  "Priya Raman",
  "Noah Bennett",
  "Sofia Alvarez",
  "Elliot Park",
  "Amara Brooks",
  "Leo Martin",
  "Nina Patel",
  "Owen Reed"
];

export const controls: Control[] = [
  {
    id: "AC-101",
    domain: "Access control",
    frameworkIds: ["soc2", "customer-review"],
    owner: "Maya Chen",
    criticality: "critical",
    objective: "User access is approved, reviewed, and removed when no longer required.",
    requirements: ["Quarterly access review report", "Joiner-mover-leaver policy excerpt"],
    reviewerNotes: "Focus review on privileged systems and terminated-user checks.",
    lastReviewed: "2026-05-21"
  },
  {
    id: "AC-102",
    domain: "Employee access",
    frameworkIds: ["customer-review", "iso27001"],
    owner: "Jordan Ellis",
    criticality: "critical",
    objective: "Employee access follows least privilege and is traceable to business need.",
    requirements: ["Role matrix snapshot", "Privileged access approval sample"],
    reviewerNotes: "Customer package needs redacted screenshots only.",
    lastReviewed: "2026-05-19"
  },
  {
    id: "AC-103",
    domain: "Access management",
    frameworkIds: ["iso27001", "soc2"],
    owner: "Priya Raman",
    criticality: "standard",
    objective: "Authentication controls are documented and periodically validated.",
    requirements: ["MFA policy excerpt", "Access exception register"],
    reviewerNotes: "Confirm exceptions include expiry dates.",
    lastReviewed: "2026-04-30"
  },
  {
    id: "CH-201",
    domain: "Change management",
    frameworkIds: ["soc2"],
    owner: "Noah Bennett",
    criticality: "critical",
    objective: "Production changes are reviewed, approved, and linked to deployment evidence.",
    requirements: ["Change approval sample", "Deployment checklist sample", "Rollback plan excerpt"],
    reviewerNotes: "Evidence should show approval before deployment.",
    lastReviewed: "2026-05-14"
  },
  {
    id: "CH-202",
    domain: "Vulnerability management",
    frameworkIds: ["customer-review", "soc2"],
    owner: "Sofia Alvarez",
    criticality: "critical",
    objective: "Vulnerability intake, triage, remediation, and exceptions are tracked.",
    requirements: ["Vulnerability triage summary", "Remediation SLA policy"],
    reviewerNotes: "Summaries must stay synthetic and non-environment-specific.",
    lastReviewed: "2026-05-24"
  },
  {
    id: "IR-301",
    domain: "Incident response",
    frameworkIds: ["soc2", "customer-review"],
    owner: "Elliot Park",
    criticality: "critical",
    objective: "Incident response procedures are documented, tested, and reviewed.",
    requirements: ["Incident response drill notes", "Incident severity matrix"],
    reviewerNotes: "Latest drill needs reviewer approval.",
    lastReviewed: "2026-04-18"
  },
  {
    id: "IR-302",
    domain: "Incident process",
    frameworkIds: ["customer-review"],
    owner: "Amara Brooks",
    criticality: "standard",
    objective: "Customer-facing incident communication process is defined and reviewable.",
    requirements: ["Customer notification template", "Incident postmortem sample"],
    reviewerNotes: "Keep customer names synthetic in the package preview.",
    lastReviewed: "2026-05-02"
  },
  {
    id: "VM-401",
    domain: "Vendor management",
    frameworkIds: ["soc2", "iso27001", "customer-review"],
    owner: "Leo Martin",
    criticality: "critical",
    objective: "Subprocessors and suppliers are assessed before onboarding and reviewed periodically.",
    requirements: ["Vendor risk assessment", "Subprocessor register excerpt", "Supplier questionnaire"],
    reviewerNotes: "Flag expired assessments as high-priority gaps.",
    lastReviewed: "2026-03-29"
  },
  {
    id: "VM-402",
    domain: "Supplier security",
    frameworkIds: ["iso27001"],
    owner: "Nina Patel",
    criticality: "standard",
    objective: "Supplier security obligations are tracked and reviewed.",
    requirements: ["Supplier contract control clause", "Annual supplier review summary"],
    reviewerNotes: "Confirm owners are assigned for each key supplier.",
    lastReviewed: "2026-04-12"
  },
  {
    id: "SM-501",
    domain: "Security monitoring",
    frameworkIds: ["soc2"],
    owner: "Owen Reed",
    criticality: "critical",
    objective: "Security monitoring rules and alert handling are documented.",
    requirements: ["Monitoring alert policy", "Alert triage sample"],
    reviewerNotes: "Avoid real alert payloads in public demo data.",
    lastReviewed: "2026-05-27"
  },
  {
    id: "SM-502",
    domain: "Security monitoring",
    frameworkIds: ["soc2", "customer-review"],
    owner: "Maya Chen",
    criticality: "standard",
    objective: "Logging coverage is periodically checked for critical systems.",
    requirements: ["Log coverage checklist", "Monitoring review notes"],
    reviewerNotes: "Needs current-quarter evidence.",
    lastReviewed: "2026-05-05"
  },
  {
    id: "AI-601",
    domain: "Asset inventory",
    frameworkIds: ["iso27001"],
    owner: "Jordan Ellis",
    criticality: "standard",
    objective: "Information assets are inventoried with owners and classification.",
    requirements: ["Asset register snapshot", "Asset owner attestation"],
    reviewerNotes: "Inventory should include classification labels.",
    lastReviewed: "2026-04-08"
  },
  {
    id: "RT-701",
    domain: "Risk treatment",
    frameworkIds: ["iso27001"],
    owner: "Priya Raman",
    criticality: "critical",
    objective: "Risks are recorded with treatment decisions, owners, and target dates.",
    requirements: ["Risk register excerpt", "Risk treatment plan sample"],
    reviewerNotes: "High risks should have target dates.",
    lastReviewed: "2026-05-16"
  },
  {
    id: "BC-801",
    domain: "Business continuity",
    frameworkIds: ["iso27001", "customer-review"],
    owner: "Noah Bennett",
    criticality: "standard",
    objective: "Recovery capabilities are tested and tracked through action items.",
    requirements: ["Recovery test record", "Continuity action tracker"],
    reviewerNotes: "Package can include summary, not raw exercise notes.",
    lastReviewed: "2026-04-25"
  },
  {
    id: "DH-901",
    domain: "Encryption and data handling",
    frameworkIds: ["customer-review"],
    owner: "Sofia Alvarez",
    criticality: "critical",
    objective: "Encryption, retention, and data handling commitments are documented.",
    requirements: ["Security overview", "Data handling policy excerpt", "Encryption control attestation"],
    reviewerNotes: "Use customer-safe excerpts only.",
    lastReviewed: "2026-05-29"
  },
  {
    id: "PK-902",
    domain: "Customer package",
    frameworkIds: ["customer-review"],
    owner: "Elliot Park",
    criticality: "standard",
    objective: "Customer review packages are complete, redacted, and traceable to approved evidence.",
    requirements: ["Recent review summary", "Redacted sample evidence"],
    reviewerNotes: "Generate package only after high gaps are closed.",
    lastReviewed: "2026-05-31"
  },
  {
    id: "POL-101",
    domain: "Policy governance",
    frameworkIds: ["soc2", "iso27001"],
    owner: "Amara Brooks",
    criticality: "standard",
    objective: "Security policies are owned, reviewed, and communicated.",
    requirements: ["Policy review record", "Security policy acknowledgement summary"],
    reviewerNotes: "Policy excerpts should not include internal links.",
    lastReviewed: "2026-04-02"
  },
  {
    id: "TR-201",
    domain: "Security training",
    frameworkIds: ["soc2", "customer-review"],
    owner: "Leo Martin",
    criticality: "standard",
    objective: "Workforce security training completion is monitored.",
    requirements: ["Training completion summary", "New hire training checklist"],
    reviewerNotes: "Use aggregate completion only.",
    lastReviewed: "2026-04-20"
  },
  {
    id: "DP-301",
    domain: "Data privacy operations",
    frameworkIds: ["customer-review", "iso27001"],
    owner: "Nina Patel",
    criticality: "standard",
    objective: "Data requests and retention procedures are documented.",
    requirements: ["Retention schedule excerpt", "Data request workflow sample"],
    reviewerNotes: "No personal data should appear in evidence previews.",
    lastReviewed: "2026-05-11"
  },
  {
    id: "CFG-401",
    domain: "Configuration management",
    frameworkIds: ["soc2"],
    owner: "Owen Reed",
    criticality: "critical",
    objective: "Security-relevant configuration baselines are tracked and reviewed.",
    requirements: ["Configuration baseline sample", "Quarterly configuration review"],
    reviewerNotes: "Baseline must be generic and environment-free.",
    lastReviewed: "2026-03-22"
  },
  {
    id: "BK-501",
    domain: "Backup and recovery",
    frameworkIds: ["iso27001", "customer-review"],
    owner: "Maya Chen",
    criticality: "critical",
    objective: "Backups are monitored and restoration is periodically tested.",
    requirements: ["Backup status summary", "Restore test evidence"],
    reviewerNotes: "Expired restore tests should block package readiness.",
    lastReviewed: "2026-04-14"
  },
  {
    id: "DLP-601",
    domain: "Data handling",
    frameworkIds: ["customer-review"],
    owner: "Jordan Ellis",
    criticality: "standard",
    objective: "Sensitive data handling controls are documented for customer review.",
    requirements: ["Data classification guide", "Redaction procedure excerpt"],
    reviewerNotes: "Confirm redaction status before package generation.",
    lastReviewed: "2026-05-17"
  },
  {
    id: "REV-701",
    domain: "Review operations",
    frameworkIds: ["soc2", "iso27001", "customer-review"],
    owner: "Priya Raman",
    criticality: "standard",
    objective: "Compliance reviews move through documented human review states.",
    requirements: ["Review queue operating procedure", "Reviewer decision log sample"],
    reviewerNotes: "Audit log must show before and after states.",
    lastReviewed: "2026-06-01"
  },
  {
    id: "EX-801",
    domain: "Exception management",
    frameworkIds: ["soc2", "iso27001"],
    owner: "Noah Bennett",
    criticality: "standard",
    objective: "Control exceptions are approved, time-bound, and tracked to closure.",
    requirements: ["Exception register excerpt", "Exception approval sample"],
    reviewerNotes: "Needs due dates and owner fields.",
    lastReviewed: "2026-05-07"
  }
];

const statuses: EvidenceStatus[] = [
  "approved",
  "approved",
  "in_review",
  "needs_changes",
  "collected",
  "expired",
  "missing",
  "rejected"
];

const sourceTypes = [
  "Policy excerpt",
  "Workflow snapshot",
  "Review report",
  "Ticket sample",
  "Attestation",
  "Register excerpt"
];

const collectedDates = [
  "2026-06-01",
  "2026-05-18",
  "2026-05-02",
  "2026-04-12",
  "2026-03-10",
  "2025-11-19",
  null,
  "2026-02-07"
];

export const evidenceItems: EvidenceItem[] = controls.flatMap((control, controlIndex) =>
  control.requirements.map((requirement, requirementIndex) => {
    const sequence = controlIndex * 3 + requirementIndex;
    const status = statuses[sequence % statuses.length];
    const collectedDate = status === "missing" ? null : collectedDates[sequence % collectedDates.length];
    const risk = sequence % 9 === 5 || status === "expired" || status === "rejected" ? "high" : sequence % 3 === 0 ? "medium" : "low";

    return {
      id: `EVD-${String(sequence + 1).padStart(3, "0")}`,
      title: requirement,
      controlIds: [control.id],
      frameworkIds: control.frameworkIds,
      owner: owners[sequence % owners.length],
      sourceType: sourceTypes[sequence % sourceTypes.length],
      collectedDate,
      freshnessDays: sequence % 5 === 0 ? 90 : 180,
      sensitivity: sequence % 7 === 0 ? "restricted" : sequence % 4 === 0 ? "confidential" : "internal",
      status,
      risk,
      dueDate: `2026-06-${String((sequence % 18) + 10).padStart(2, "0")}`,
      excerpt: `${requirement} shows a synthetic control sample with redacted system names and no live identifiers.`,
      summary: `Reviewer-ready summary for ${control.id}: owner, date, review scope, linked controls, and observed exceptions.`,
      riskNotes:
        risk === "high"
          ? "High customer-facing impact until the evidence is refreshed and approved."
          : "No sensitive production values are included in this synthetic preview.",
      missingFields:
        status === "missing"
          ? ["collected date", "reviewer"]
          : status === "needs_changes"
            ? ["owner confirmation"]
            : status === "rejected"
              ? ["scope validation", "redaction confirmation"]
              : []
    };
  })
);

const auditActions = [
  "evidence collected",
  "review requested",
  "evidence approved",
  "changes requested",
  "evidence expired",
  "control readiness recalculated",
  "package preview refreshed",
  "gap severity updated"
];

export const auditEvents: AuditEvent[] = Array.from({ length: 42 }, (_, index) => {
  const evidence = evidenceItems[index % evidenceItems.length];
  const action = auditActions[index % auditActions.length];
  const beforeStatus = index % 4 === 0 ? "collected" : index % 4 === 1 ? "in_review" : evidence.status;
  const afterStatus = index % 4 === 0 ? "in_review" : index % 4 === 1 ? "approved" : evidence.status;

  return {
    id: `AUD-${String(index + 1).padStart(3, "0")}`,
    timestamp: new Date(Date.UTC(2026, 5, 12 - Math.floor(index / 4), 15 - (index % 8), 20, 0)).toISOString(),
    actor: owners[(index + 2) % owners.length],
    action,
    targetType: index % 6 === 0 ? "package" : index % 5 === 0 ? "control" : "evidence",
    targetId: index % 6 === 0 ? "PKG-CUSTOMER-REVIEW" : index % 5 === 0 ? controls[index % controls.length].id : evidence.id,
    beforeStatus,
    afterStatus,
    note: "Synthetic audit event generated for portfolio demo traceability."
  };
});
