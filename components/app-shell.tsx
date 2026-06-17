"use client";

import { useMemo, useState } from "react";
import { Archive, ClipboardCheck, Gauge, ListChecks, Search, Shield, TriangleAlert } from "lucide-react";
import { AuditLogTable } from "@/components/audit-log-table";
import { ComplianceDashboard } from "@/components/compliance-dashboard";
import { ControlLibrary } from "@/components/control-library";
import { GapAnalysis } from "@/components/gap-analysis";
import { PackageBuilder } from "@/components/package-builder";
import { ReadinessKpis } from "@/components/readiness-kpis";
import { StatusBadge } from "@/components/status-badge";
import {
  calculateControlReadiness,
  calculateFrameworkReadiness,
  detectGaps,
  evaluatePackageReadiness,
  getEffectiveEvidenceStatus,
  transitionEvidence
} from "@/lib/compliance-engine";
import { asOfDate, auditEvents as seedAuditEvents, controls, evidenceItems as seedEvidenceItems, frameworks } from "@/lib/demo-data";
import type { AuditEvent, EvidenceItem, FrameworkId, ReviewerAction } from "@/lib/compliance-types";

type ViewKey = "dashboard" | "controls" | "gaps" | "package" | "audit";
type FilterKey = "all" | "missing" | "in_review" | "approved" | "needs_changes" | "expired";

const navItems: Array<{ key: ViewKey; label: string; icon: React.ReactNode }> = [
  { key: "dashboard", label: "Dashboard", icon: <Gauge size={17} /> },
  { key: "controls", label: "Controls", icon: <ListChecks size={17} /> },
  { key: "gaps", label: "Gaps", icon: <TriangleAlert size={17} /> },
  { key: "package", label: "Package", icon: <Archive size={17} /> },
  { key: "audit", label: "Audit log", icon: <ClipboardCheck size={17} /> }
];

const filters: FilterKey[] = ["all", "missing", "in_review", "approved", "needs_changes", "expired"];

export function AppShell() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [selectedControlId, setSelectedControlId] = useState(controls[0].id);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(seedEvidenceItems[0].id);
  const [selectedPackageFrameworkId, setSelectedPackageFrameworkId] = useState<FrameworkId>("customer-review");
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(seedEvidenceItems);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(seedAuditEvents);
  const [reviewerNote, setReviewerNote] = useState("Reviewed against synthetic evidence policy.");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [packageStatus, setPackageStatus] = useState<"draft" | "generated">("draft");
  const [persistedIds, setPersistedIds] = useState<Set<string>>(new Set());

  const readinessByControl = useMemo(
    () =>
      new Map(
        controls.map((control) => [control.id, calculateControlReadiness(control, evidenceItems, asOfDate)])
      ),
    [evidenceItems]
  );

  const frameworkScores = useMemo(
    () => frameworks.map((framework) => calculateFrameworkReadiness(framework.id, controls, evidenceItems, asOfDate)),
    [evidenceItems]
  );

  const gaps = useMemo(() => detectGaps(controls, evidenceItems, asOfDate), [evidenceItems]);
  const packageEvaluation = useMemo(
    () => evaluatePackageReadiness(selectedPackageFrameworkId, controls, evidenceItems, asOfDate),
    [evidenceItems, selectedPackageFrameworkId]
  );

  const filteredEvidence = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return evidenceItems.filter((item) => {
      const effectiveStatus = getEffectiveEvidenceStatus(item, asOfDate);
      const matchesFilter = filter === "all" || effectiveStatus === filter;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [item.id, item.title, item.owner, item.controlIds.join(" "), item.frameworkIds.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, [evidenceItems, filter, query]);

  const selectedEvidence =
    evidenceItems.find((item) => item.id === selectedEvidenceId) ?? filteredEvidence[0] ?? evidenceItems[0];
  const controlsReady = [...readinessByControl.values()].filter((item) => item.status === "ready").length;
  const overallReadiness =
    frameworkScores.length === 0
      ? 0
      : Math.round(frameworkScores.reduce((sum, item) => sum + item.readinessScore, 0) / frameworkScores.length);
  const missingEvidence = evidenceItems.filter((item) => getEffectiveEvidenceStatus(item, asOfDate) === "missing").length;
  const inReviewEvidence = evidenceItems.filter((item) => getEffectiveEvidenceStatus(item, asOfDate) === "in_review").length;
  const expiredEvidence = evidenceItems.filter((item) => getEffectiveEvidenceStatus(item, asOfDate) === "expired").length;
  const includedEvidence = evidenceItems.filter(
    (item) => item.frameworkIds.includes(selectedPackageFrameworkId) && getEffectiveEvidenceStatus(item, asOfDate) === "approved"
  );
  const excludedEvidence = evidenceItems.filter(
    (item) => item.frameworkIds.includes(selectedPackageFrameworkId) && getEffectiveEvidenceStatus(item, asOfDate) !== "approved"
  );

  async function handleReviewerAction(action: ReviewerAction) {
    if (!selectedEvidence) {
      return;
    }

    const { updatedEvidence, auditEvent } = transitionEvidence(
      selectedEvidence,
      action,
      "Avery Stone",
      reviewerNote,
      new Date().toISOString()
    );
    setEvidenceItems((current) => current.map((item) => (item.id === updatedEvidence.id ? updatedEvidence : item)));
    setAuditEvents((current) => [auditEvent, ...current]);

    try {
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auditEvent),
      });
      setPersistedIds((prev) => new Set([...prev, auditEvent.id]));
    } catch {
      // Non-fatal: the in-memory chain is the source of truth; DB is best-effort
    }
  }

  async function handleGeneratePackage() {
    const auditEvent: AuditEvent = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Avery Stone",
      action: "package generated",
      targetType: "package",
      targetId: `PKG-${selectedPackageFrameworkId.toUpperCase()}`,
      beforeStatus: packageStatus,
      afterStatus: "generated",
      note: "Synthetic export preview generated from approved, redacted evidence.",
    };

    setPackageStatus("generated");
    setAuditEvents((current) => [auditEvent, ...current]);

    try {
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auditEvent),
      });
      setPersistedIds((prev) => new Set([...prev, auditEvent.id]));
    } catch {
      // Non-fatal
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span><Shield size={20} /></span>
          <strong>EvidenceOps</strong>
        </div>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              className={activeView === item.key ? "nav-item active" : "nav-item"}
              key={item.key}
              onClick={() => setActiveView(item.key)}
              type="button"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-status">
          <span>Customer package</span>
          <StatusBadge status={packageEvaluation.status} />
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <p>Security Compliance Evidence Automation</p>
            <h1>Compliance evidence command center</h1>
          </div>
          <div className="search-box">
            <Search size={16} />
            <input
              aria-label="Search evidence"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search controls, owners, evidence"
              value={query}
            />
          </div>
        </header>
        <ReadinessKpis
          controlsReady={controlsReady}
          controlsTotal={controls.length}
          expired={expiredEvidence}
          inReview={inReviewEvidence}
          missingEvidence={missingEvidence}
          overallReadiness={overallReadiness}
          packageStatus={packageEvaluation.status === "ready" ? "Ready" : "Review"}
        />
        <div className="filter-bar" aria-label="Evidence status filters">
          {filters.map((status) => (
            <button
              className={filter === status ? "active" : ""}
              key={status}
              onClick={() => setFilter(status)}
              type="button"
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
        {activeView === "dashboard" && (
          <ComplianceDashboard
            asOf={asOfDate}
            filteredEvidence={filteredEvidence}
            frameworkScores={frameworkScores}
            frameworks={frameworks}
            gapPanel={<GapAnalysis gaps={gaps} />}
            onReviewerAction={handleReviewerAction}
            onReviewerNoteChange={setReviewerNote}
            onSelectEvidence={setSelectedEvidenceId}
            reviewerNote={reviewerNote}
            selectedEvidence={selectedEvidence}
            selectedEvidenceId={selectedEvidence?.id ?? selectedEvidenceId}
          />
        )}
        {activeView === "controls" && (
          <ControlLibrary
            controls={controls}
            evidenceItems={evidenceItems}
            onSelectControl={setSelectedControlId}
            readinessByControl={readinessByControl}
            selectedControlId={selectedControlId}
          />
        )}
        {activeView === "gaps" && <GapAnalysis gaps={gaps} />}
        {activeView === "package" && (
          <PackageBuilder
            evaluation={packageEvaluation}
            excludedEvidence={excludedEvidence}
            frameworks={frameworks}
            includedEvidence={includedEvidence}
            onGeneratePackage={handleGeneratePackage}
            onSelectFramework={setSelectedPackageFrameworkId}
            packageStatus={packageStatus}
            selectedFrameworkId={selectedPackageFrameworkId}
          />
        )}
        {activeView === "audit" && <AuditLogTable events={auditEvents} persistedIds={persistedIds} />}
      </section>
    </main>
  );
}
