"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getFailures, updateFailure } from "@/features/failures/api";
import type { Failure, FailureStatus } from "@/features/failures/types";
import { getTestRuns } from "@/features/test-runs/api";
import { FailureCard } from "@/features/failures/components/failure-card";
import { formatPercentage } from "@/lib/utils";

export default function AgentFailuresPage() {
  const params = useParams<{ agentId: string }>();
  const agentId = params.agentId;

  const [failures, setFailures] = useState<Failure[]>([]);
  const [totalAgentTests, setTotalAgentTests] = useState(0);
  const [failedAgentTests, setFailedAgentTests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!agentId) return;

      try {
        setLoading(true);
        setError(null);

        const [allRuns, allFailures] = await Promise.all([
          getTestRuns(),
          getFailures(),
        ]);

        const agentRuns = allRuns.filter(
          (run) => run.agentId === agentId,
        );
        const agentRunIds = new Set(
          agentRuns.map((run) => run.id),
        );

        const agentFailures = allFailures.filter(
          (failure) => agentRunIds.has(failure.runId),
        );

        const totalTests = agentRuns.reduce(
          (sum, run) => sum + run.totalTests,
          0,
        );
        const failedTests = agentRuns.reduce(
          (sum, run) => sum + run.failedTests,
          0,
        );

        setFailures(agentFailures);
        setTotalAgentTests(totalTests);
        setFailedAgentTests(failedTests);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load agent failures",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [agentId]);

  const criticalCount = failures.filter(
    (f) => f.severity === "critical",
  ).length;

  const failureRate =
    totalAgentTests > 0
      ? (failedAgentTests / totalAgentTests) * 100
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/agents/${agentId}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to agent
        </Link>

        <div className="mt-4">
          <p className="text-sm font-medium text-zinc-500">
            Failure Analysis
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Failures
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Investigate reliability failures detected during evaluation.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">
            Total Failures
          </p>

          <p className="mt-3 text-3xl font-semibold">{failures.length}</p>

          <p className="mt-1 text-xs text-zinc-400">
            Across all test runs
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">
            Critical
          </p>

          <p className="mt-3 text-3xl font-semibold">{criticalCount}</p>

          <p className="mt-1 text-xs text-zinc-400">
            Immediate attention required
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">
            Failure Rate
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {formatPercentage(failureRate)}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {failedAgentTests} failed / {totalAgentTests} total tests
          </p>
        </div>
      </div>

      <section className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Detected Failures</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Reliability failures recorded for this agent.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            Loading failures...
          </div>
        ) : failures.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center p-8 text-center">
            <div>
              <p className="font-medium text-zinc-700">No failures detected</p>

              <p className="mt-1 text-sm text-zinc-500">
                Failures will appear here if the evaluation engine detects misbehavior.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {failures.map((failure) => (
              <FailureCard
                key={failure.id}
                failure={failure}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}