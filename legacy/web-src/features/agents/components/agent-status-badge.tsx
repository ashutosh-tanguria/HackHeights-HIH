import { Badge } from "@/components/ui/badge";
import type { AgentStatus } from "../types";

type AgentStatusBadgeProps = {
  status: AgentStatus;
};

const statusConfig = {
  active: {
    label: "Active",
    variant: "success",
  },
  inactive: {
    label: "Inactive",
    variant: "default",
  },
  error: {
    label: "Error",
    variant: "danger",
  },
  not_configured: {
    label: "Not configured",
    variant: "warning",
  },
} as const;

export function AgentStatusBadge({
  status,
}: AgentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}