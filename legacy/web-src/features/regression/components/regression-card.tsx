import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { RegressionResult } from "../api";

type RegressionCardProps = {
  result: RegressionResult;
};

export function RegressionCard({
  result,
}: RegressionCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Run Comparison
            </p>

            <div className="mt-2 flex items-center gap-3">
              <span className="font-mono text-sm">
                {result.baselineRunId}
              </span>

              <span className="text-zinc-400">
                →
              </span>

              <span className="font-mono text-sm">
                {result.currentRunId}
              </span>
            </div>
          </div>

          <Badge
            variant={
              result.regressed
                ? "danger"
                : result.scoreDelta > 0
                  ? "success"
                  : "default"
            }
          >
            {result.regressed
              ? "Regressed"
              : result.scoreDelta > 0
                ? "Improved"
                : "Stable"}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric
            label="Baseline Score"
            value={`${result.baselineScore.toFixed(1)}%`}
          />

          <Metric
            label="Current Score"
            value={`${result.currentScore.toFixed(1)}%`}
          />

          <Metric
            label="Score Change"
            value={`${result.scoreDelta > 0 ? "+" : ""}${result.scoreDelta.toFixed(1)}%`}
          />

          <Metric
            label="New Failures"
            value={String(result.newFailures)}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-6 border-t pt-4 text-sm text-zinc-500">
          <span>
            Baseline failures:{" "}
            <strong className="font-medium text-zinc-900">
              {result.baselineFailedTests}
            </strong>
          </span>

          <span>
            Current failures:{" "}
            <strong className="font-medium text-zinc-900">
              {result.currentFailedTests}
            </strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}