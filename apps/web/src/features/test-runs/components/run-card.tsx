import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { RunStatusBadge } from "./run-status-badge";
import type { TestRun } from "../types";

type RunCardProps = {
  run: TestRun;
};

export function RunCard({ run }: RunCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href={`/runs/${run.id}`}
                className="font-mono text-sm font-semibold hover:underline"
              >
                {run.id}
              </Link>

              <RunStatusBadge status={run.status} />
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              {run.totalTests} tests evaluated
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-zinc-500">
              Reliability
            </p>

            <p className="mt-1 text-xl font-semibold">
              {run.reliabilityScore === null
                ? "--"
                : `${Math.round(run.reliabilityScore)}%`}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-zinc-400">
              Total
            </p>

            <p className="mt-1 text-sm font-medium">
              {run.totalTests}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-400">
              Passed
            </p>

            <p className="mt-1 text-sm font-medium">
              {run.passedTests}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-400">
              Failed
            </p>

            <p className="mt-1 text-sm font-medium">
              {run.failedTests}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-400">
              Duration
            </p>

            <p className="mt-1 text-sm font-medium">
              {run.durationMs === null
                ? "--"
                : `${(run.durationMs / 1000).toFixed(2)}s`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}