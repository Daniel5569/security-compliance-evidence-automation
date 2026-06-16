import { AlertTriangle, Archive, CheckCircle2, Clock3, FileWarning, ShieldCheck } from "lucide-react";
import { formatPercent } from "@/lib/formatters";

interface ReadinessKpisProps {
  overallReadiness: number;
  controlsReady: number;
  controlsTotal: number;
  missingEvidence: number;
  inReview: number;
  expired: number;
  packageStatus: string;
}

const kpiIconClass = "kpi-icon";

export function ReadinessKpis({
  overallReadiness,
  controlsReady,
  controlsTotal,
  missingEvidence,
  inReview,
  expired,
  packageStatus
}: ReadinessKpisProps) {
  const kpis = [
    {
      label: "Overall readiness",
      value: formatPercent(overallReadiness),
      detail: "Across active views",
      icon: <ShieldCheck className={kpiIconClass} />
    },
    {
      label: "Controls ready",
      value: `${controlsReady}/${controlsTotal}`,
      detail: "Approved and fresh",
      icon: <CheckCircle2 className={kpiIconClass} />
    },
    {
      label: "Evidence missing",
      value: String(missingEvidence),
      detail: "Required items",
      icon: <FileWarning className={kpiIconClass} />
    },
    {
      label: "In review",
      value: String(inReview),
      detail: "Awaiting decision",
      icon: <Clock3 className={kpiIconClass} />
    },
    {
      label: "Expired",
      value: String(expired),
      detail: "Refresh needed",
      icon: <AlertTriangle className={kpiIconClass} />
    },
    {
      label: "Package",
      value: packageStatus,
      detail: "Customer review",
      icon: <Archive className={kpiIconClass} />
    }
  ];

  return (
    <section className="kpi-grid" aria-label="Readiness KPIs">
      {kpis.map((kpi) => (
        <article className="kpi-card" key={kpi.label}>
          <div>{kpi.icon}</div>
          <div>
            <p>{kpi.label}</p>
            <strong>{kpi.value}</strong>
            <span>{kpi.detail}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
