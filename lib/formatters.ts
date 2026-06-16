export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Not collected";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function labelFromStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
