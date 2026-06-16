import type { Gap } from "@/lib/compliance-types";

export function GapAnalysis({ gaps }: { gaps: Gap[] }) {
  const topGaps = [...gaps]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 10);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Top gaps</h2>
          <p>{gaps.length} open findings across controls</p>
        </div>
      </div>
      <div className="gap-list">
        {topGaps.map((gap) => (
          <article className={`gap-item gap-${gap.severity}`} key={gap.id}>
            <div>
              <strong>{gap.controlId}</strong>
              <span>{gap.reason}</span>
            </div>
            <p>{gap.impact}</p>
            <footer>
              <span>{gap.owner}</span>
              <span>{gap.nextAction}</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function severityRank(severity: Gap["severity"]) {
  return severity === "high" ? 3 : severity === "medium" ? 2 : 1;
}
