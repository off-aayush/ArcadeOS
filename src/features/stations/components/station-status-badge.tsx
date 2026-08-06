import { StationStatus } from "@/types";
import { STATION_STATUS_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StationStatusBadgeProps {
  status: StationStatus;
}

export function StationStatusBadge({ status }: StationStatusBadgeProps) {
  const style = STATION_STATUS_STYLES[status] || {
    bg: "bg-surface-border/20",
    text: "text-surface-muted",
    border: "border-surface-border",
    glow: "",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all",
        style.bg,
        style.text,
        style.border,
        style.glow
      )}
    >
      <span className={cn("status-dot h-1.5 w-1.5 bg-current")} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
