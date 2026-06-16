"use client";

import type { Control, ControlReadiness, EvidenceItem } from "@/lib/compliance-types";
import { StatusBadge } from "./status-badge";

interface ControlLibraryProps {
  controls: Control[];
  evidenceItems: EvidenceItem[];
  readinessByControl: Map<string, ControlReadiness>;
  selectedControlId: string;
  onSelectControl: (controlId: string) => void;
}

export function ControlLibrary({
  controls,
  evidenceItems,
  readinessByControl,
  selectedControlId,
  onSelectControl
}: ControlLibraryProps) {
  const selectedControl = controls.find((control) => control.id === selectedControlId) ?? controls[0];
  const selectedReadiness = readinessByControl.get(selectedControl.id);
  const linkedEvidence = evidenceItems.filter((item) => item.controlIds.includes(selectedControl.id));

  return (
    <section className="split-grid">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Control library</h2>
            <p>{controls.length} mapped controls</p>
          </div>
        </div>
        <div className="control-list">
          {controls.map((control) => {
            const readiness = readinessByControl.get(control.id);
            return (
              <button
                className={control.id === selectedControlId ? "control-row active" : "control-row"}
                key={control.id}
                onClick={() => onSelectControl(control.id)}
                type="button"
              >
                <span>
                  <strong>{control.id}</strong>
                  <small>{control.domain}</small>
                </span>
                <span>
                  <StatusBadge status={readiness?.status ?? "partial"} />
                  <small>
                    {readiness?.approvedEvidenceCount ?? 0}/{readiness?.requiredEvidenceCount ?? 0} approved
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <aside className="panel detail-panel">
        <div className="panel-heading">
          <div>
            <h2>{selectedControl.id}</h2>
            <p>{selectedControl.domain}</p>
          </div>
          <StatusBadge status={selectedReadiness?.status ?? "partial"} />
        </div>
        <div className="detail-stack">
          <div>
            <label>Objective</label>
            <p>{selectedControl.objective}</p>
          </div>
          <div className="meta-grid">
            <div>
              <label>Owner</label>
              <strong>{selectedControl.owner}</strong>
            </div>
            <div>
              <label>Mapped views</label>
              <strong>{selectedControl.frameworkIds.join(", ")}</strong>
            </div>
            <div>
              <label>Last reviewed</label>
              <strong>{selectedControl.lastReviewed}</strong>
            </div>
            <div>
              <label>Score</label>
              <strong>{selectedReadiness?.readinessScore ?? 0}%</strong>
            </div>
          </div>
          <div>
            <label>Evidence requirements</label>
            <ul className="compact-list">
              {selectedControl.requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </div>
          <div>
            <label>Linked evidence</label>
            <ul className="compact-list">
              {linkedEvidence.map((item) => (
                <li key={item.id}>
                  {item.id} · {item.title}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label>Reviewer notes</label>
            <p>{selectedControl.reviewerNotes}</p>
          </div>
        </div>
      </aside>
    </section>
  );
}
