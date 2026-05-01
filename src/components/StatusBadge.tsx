const statusConfig: Record<string, { bg: string; dot: string }> = {
  Draft: { bg: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  Submitted: { bg: "bg-info/10 text-info", dot: "bg-info" },
  Approved: { bg: "bg-success/10 text-success", dot: "bg-success" },
  Returned: { bg: "bg-warning/10 text-warning", dot: "bg-warning" },
  Rejected: { bg: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  Active: { bg: "bg-success/10 text-success", dot: "bg-success" },
  Inactive: { bg: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  "On Hold": { bg: "bg-warning/10 text-warning", dot: "bg-warning" },
  Completed: { bg: "bg-info/10 text-info", dot: "bg-info" },
  Billable: { bg: "bg-success/10 text-success", dot: "bg-success" },
  "Non-Billable": { bg: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  const config = statusConfig[normalizedStatus] || statusConfig.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {normalizedStatus}
    </span>
  );
};

export default StatusBadge;
