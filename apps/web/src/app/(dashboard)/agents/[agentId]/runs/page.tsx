"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTestRuns } from "@/features/test-runs/api";
import type { TestRun } from "@/features/test-runs/types";
import { RunStatusBadge } from "@/features/test-runs/components/run-status-badge";
import { formatDuration, formatPercentage } from "@/lib/utils";

export default function AgentRunsPage() {
  const params = useParams<{ agentId: string }>();
  const agentId = params.agentId;

  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRuns() {
      if (!agentId) return;

      try {
        setLoading(true);
        setError(null);

        const allRuns = await getTestRuns();
        const agentRuns = allRuns.filter(
          (run) => run.agentId === agentId,
        );

        setRuns(agentRuns);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load test runs",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRuns();
  }, [agentId]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/agents/${agentId}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to agent
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Evaluation History
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Test Runs
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Review previous reliability evaluations for this agent.
            </p>
          </div>

          <Link
            href="/runs/new"
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            New Test Run
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Run History</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Every evaluation run and its reliability result.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            Loading test runs...
          </div>
        ) : runs.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center p-8 text-center">
            <div>
              <p className="font-medium text-zinc-700">
                No evaluation runs yet
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Runs will appear here once an evaluation is executed for this agent.
              </p>

              <Link
                href="/runs/new"
                className="mt-4 inline-block rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Run your first evaluation
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-zinc-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-zinc-500">
                    Run
                  </th>
                  <th className="px-6 py-3 font-medium text-zinc-500">
                    Status
                  </th>
                  <th className="px-6 py-3 font-medium text-zinc-500">
                    Tests
                  </th>
                  <th className="px-6 py-3 font-medium text-zinc-500">
                    Passed
                  </th>
                  <th className="px-6 py-3 font-medium text-zinc-500">
                    Failed
                  </th>
                  <th className="px-6 py-3 font-medium text-zinc-500">
                    Score
                  </th>
                  <th className="px-6 py-3 font-medium text-zinc-500">
                    Duration
                  </th>
                </tr>
              </thead>

              <tbody>
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b last:border-0 hover:bg-zinc-50"
                  >
                    <td className="px-6 py-4 font-medium">
                      <Link
                        href={`/runs/${run.id}`}
                        className="text-zinc-900 hover:underline"
                      >
                        {run.id}
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {new Date(run.createdAt).toLocaleString()}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <RunStatusBadge status={run.status} />
                    </td>

                    <td className="px-6 py-4">{run.totalTests}</td>
                    <td className="px-6 py-4">{run.passedTests}</td>
                    <td className="px-6 py-4">{run.failedTests}</td>
                    <td className="px-6 py-4 font-medium">
                      {formatPercentage(run.reliabilityScore)}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {formatDuration(run.durationMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}