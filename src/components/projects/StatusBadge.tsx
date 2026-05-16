import { Badge } from "@/components/ui/Badge";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/workflow";
import { ProjectStatus } from "@/types/enums";

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status as ProjectStatus] ?? "#6b7280";
  const label = STATUS_LABELS[status as ProjectStatus] ?? status;
  return <Badge color={color}>{label}</Badge>;
}
