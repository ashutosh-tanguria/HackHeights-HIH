import type { TestRunStatus } from "../types";

type RunStatusBadgeProps = {
  status: TestRunStatus;
};

export function RunStatusBadge({
  status,
}: RunStatusBadgeProps) {
  const className =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "failed"
        ? "bg-red-50 text-red-700"
        : status === "running"
          ? "bg-blue-50 text-blue-700"
          : status === "cancelled"
            ? "bg-zinc-100 text-zinc-600"
            : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {status}
    </span>
  );
}