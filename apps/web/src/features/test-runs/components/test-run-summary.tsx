import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TestRun } from "../types";

type TestRunSummaryProps = {
  run: TestRun;
};

export function TestRunSummary({
  run,
}: TestRunSummaryProps) {
  const statusVariant =
    run.status === "completed"
      ? "success"
      : run.status === "failed"
        ? "danger"
        : "default";

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Card>
        <CardContent>
          <p className="text-xs font-medium text-zinc-400">
            Status
          </p>

          <div className="mt-2">
            <Badge variant={statusVariant}>
              {run.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-xs font-medium text-zinc-400">
            Tests
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {run.totalTests}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {run.passedTests} passed ·{" "}
            {run.failedTests} failed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-xs font-medium text-zinc-400">
            Reliability Score
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {run.reliabilityScore !== null
              ? `${run.reliabilityScore.toFixed(1)}%`
              : "-"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-xs font-medium text-zinc-400">
            Duration
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {run.durationMs !== null
              ? `${run.durationMs} ms`
              : "-"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-xs font-medium text-zinc-400">
            Created
          </p>

          <p className="mt-2 text-sm font-medium">
            {new Date(
              run.createdAt,
            ).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}