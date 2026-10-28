"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTestRuns } from "@/features/test-runs/api";
import type { TestRun } from "@/features/test-runs/types";
import {
  compareRuns,
  type RegressionResult,
} from "@/features/regression/api";
import { RegressionCard } from "@/features/regression/components/regression-card";

export default function AgentRegressionPage() {
  const params = useParams<{ agentId: string }>();
  const agentId = params.agentId;

  const [runs, setRuns] = useState<TestRun[]>([]);
  const [baselineRunId, setBaselineRunId] = useState("");
  const [currentRunId, setCurrentRunId] = useState("");
  const [result, setResult] = useState<RegressionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
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

        if (agentRuns.length >= 2) {
          setBaselineRunId(agentRuns[1].id);
          setCurrentRunId(agentRuns[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load agent test runs",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRuns();
  }, [agentId]);

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault();

    if (!baselineRunId || !currentRunId) {
      setError("Please select both a baseline run and a current run.");
      return;
    }

    if (baselineRunId === currentRunId) {
      setError("Baseline and current runs must be different.");
      return;
    }

    try {
      setComparing(true);
      setError(null);
      setResult(null);

      const comparison = await compareRuns(
        baselineRunId,
        currentRunId,
      );
      setResult(comparison);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to compare runs",
      );
    } finally {
      setComparing(false);
    }
  }

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
            Regression Analysis
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Regression
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Compare test runs to identify reliability improvements or regressions.
          </p>
        </div>
      </div>

      <section className="rounded-xl border bg-white p-6">
        <div>
          <h2 className="font-semibold">Compare Test Runs</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Select a baseline run and a newer evaluation run for this agent.
          </p>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-zinc-400">
            Loading test runs...
          </p>
        ) : runs.length < 2 ? (
          <div className="mt-6 rounded-lg bg-zinc-50 p-6 text-center">
            <p className="font-medium text-zinc-700">
              At least two test runs are required
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Execute another evaluation run to compare reliability across runs.
            </p>

            <Link
              href="/runs/new"
              className="mt-4 inline-block rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Run Evaluation
            </Link>
          </div>
        ) : (
          <form onSubmit={handleCompare} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="baselineRun"
                  className="text-sm font-medium text-zinc-950"
                >
                  Baseline Run
                </label>

                <select
                  id="baselineRun"
                  value={baselineRunId}
                  onChange={(e) => {
                    setBaselineRunId(e.target.value);
                    setResult(null);
                  }}
                  className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                >
                  <option value="">Select baseline run</option>
                  {runs.map((run) => (
                    <option key={run.id} value={run.id}>
                      {run.id} ({new Date(run.createdAt).toLocaleDateString()}) - {run.passedTests}/{run.totalTests} passed
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="currentRun"
                  className="text-sm font-medium text-zinc-950"
                >
                  Current Run
                </label>

                <select
                  id="currentRun"
                  value={currentRunId}
                  onChange={(e) => {
                    setCurrentRunId(e.target.value);
                    setResult(null);
                  }}
                  className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                >
                  <option value="">Select current run</option>
                  {runs.map((run) => (
                    <option key={run.id} value={run.id}>
                      {run.id} ({new Date(run.createdAt).toLocaleDateString()}) - {run.passedTests}/{run.totalTests} passed
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={comparing}
                className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {comparing ? "Comparing..." : "Compare Runs"}
              </button>
            </div>
          </form>
        )}
      </section>

      {result && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-950">
            Comparison Result
          </h2>

          <RegressionCard result={result} />
        </section>
      )}
    </div>
  );
}