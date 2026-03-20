export function getHealthColor(status: string): string {
  if (status === "healthy") return "#10b981";
  if (status === "warning") return "#f59e0b";
  return "#ef4444";
}

export function getHealthBg(status: string): string {
  if (status === "healthy") return "rgba(16,185,129,0.1)";
  if (status === "warning") return "rgba(245,158,11,0.1)";
  return "rgba(239,68,68,0.1)";
}

export function getPriorityColor(priority: string): string {
  if (priority === "critical") return "#ef4444";
  if (priority === "high") return "#f59e0b";
  if (priority === "medium") return "#6366f1";
  return "#64748b";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
