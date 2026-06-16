import { labelFromStatus } from "@/lib/formatters";

const statusClassNames: Record<string, string> = {
  ready: "badge badge-ready",
  approved: "badge badge-ready",
  partial: "badge badge-partial",
  collected: "badge badge-neutral",
  in_review: "badge badge-review",
  needs_review: "badge badge-review",
  needs_changes: "badge badge-review",
  missing: "badge badge-muted",
  blocked: "badge badge-danger",
  rejected: "badge badge-danger",
  expired: "badge badge-danger",
  not_ready: "badge badge-danger",
  review_needed: "badge badge-review"
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={statusClassNames[status] ?? "badge badge-neutral"}>{labelFromStatus(status)}</span>;
}
