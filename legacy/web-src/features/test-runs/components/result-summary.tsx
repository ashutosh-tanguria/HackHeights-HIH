import { Card, CardContent } from "@/components/ui/card";
import type { TestRun } from "../types";

type ResultSummaryProps = {
  run: TestRun;
};

export function ResultSummary({
  run,
}: ResultSummaryProps) {
  const passRate =
    run.totalTests > 0
      ? Math.round((run.passedTests / run.totalTests) * 100)
      : 0;

  const failureRate =
    run.totalTests > 0
      ? Math.round((run.failedTests / run.totalTests) * 100)
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent>
          <p className="text-sm font-medium text-zinc-500">
            Reliability
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {run.reliabilityScore === null
              ? "--"
              : `${Math.round(run.reliabilityScore)}%`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-sm font-medium text-zinc-500">
            Pass Rate
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {passRate}%
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {run.passedTests} of {run.totalTests} tests passed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-sm font-medium text-zinc-500">
            Failure Rate
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {failureRate}%
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {run.failedTests} failed tests
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-sm font-medium text-zinc-500">
            Duration
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {run.durationMs === null
              ? "--"
              : `${(run.durationMs / 1000).toFixed(2)}s`}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            Execution duration
          </p>
        </CardContent>
      </Card>
    </div>
  );
}