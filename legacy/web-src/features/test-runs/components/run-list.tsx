import Link from "next/link";
import type { TestRun } from "../types";
import { RunStatusBadge } from "./run-status-badge";

type RunListProps = {
  runs: TestRun[];
};

export function RunList({
  runs,
}: RunListProps) {
  if (runs.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center">
        <p className="text-sm text-zinc-400">
          No test runs yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="divide-y">
        {runs.map((run) => (
          <Link
            key={run.id}
            href={`/runs/${run.id}`}
            className="block px-6 py-5 transition hover:bg-zinc-50"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="truncate text-sm font-medium">
                    {run.id}
                  </p>

                  <RunStatusBadge
                    status={run.status}
                  />
                </div>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
                  <span>
                    Agent: {run.agentId}
                  </span>

                  <span>
                    Scenario: {run.suiteId}
                  </span>

                  <span>
                    {new Date(
                      run.createdAt,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 text-right">
                <div>
                  <p className="text-xs text-zinc-400">
                    Score
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {run.reliabilityScore ===
                    null
                      ? "-"
                      : `${run.reliabilityScore}%`}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">
                    Passed
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-600">
                    {run.passedTests}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">
                    Failed
                  </p>

                  <p className="mt-1 text-sm font-semibold text-red-600">
                    {run.failedTests}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}