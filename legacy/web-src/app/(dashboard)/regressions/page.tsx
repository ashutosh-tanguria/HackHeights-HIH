"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTestRuns } from "@/features/test-runs/api";
import type { TestRun } from "@/features/test-runs/types";
import {
  compareRuns,
  type RegressionResult,
} from "@/features/regression/api";
import { RegressionCard } from "@/features/regression/components/regression-card";

export default function RegressionsPage() {
  const [runs, setRuns] =
    useState<TestRun[]>([]);

  const [baselineRunId, setBaselineRunId] =
    useState("");

  const [currentRunId, setCurrentRunId] =
    useState("");

  const [result, setResult] =
    useState<RegressionResult | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [comparing, setComparing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadRuns() {
      try {
        setLoading(true);
        setError(null);

        const data = await getTestRuns();

        setRuns(data);

        if (data.length >= 2) {
          setBaselineRunId(data[1].id);
          setCurrentRunId(data[0].id);
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load test runs",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRuns();
  }, []);

  async function handleCompare(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !baselineRunId ||
      !currentRunId
    ) {
      setError(
        "Select both baseline and current runs.",
      );
      return;
    }

    if (
      baselineRunId === currentRunId
    ) {
      setError(
        "Baseline and current runs must be different.",
      );
      return;
    }

    const baselineRun = runs.find(
      (run) =>
        run.id === baselineRunId,
    );

    const currentRun = runs.find(
      (run) =>
        run.id === currentRunId,
    );

    if (!baselineRun || !currentRun) {
      setError(
        "Selected runs could not be found.",
      );
      return;
    }

    if (
      baselineRun.agentId !==
      currentRun.agentId
    ) {
      setError(
        "Baseline and current runs must belong to the same agent.",
      );
      return;
    }

    try {
      setComparing(true);
      setError(null);
      setResult(null);

      const comparison =
        await compareRuns(
          baselineRunId,
          currentRunId,
        );

      setResult(comparison);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
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
          href="/runs"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Test Runs
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Regression Detection
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Compare two test runs from the same
          agent and inspect reliability changes.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <h2 className="font-semibold text-zinc-950">
            Compare Runs
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Choose an earlier run as the baseline
            and a newer run as the current result.
          </p>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-zinc-400">
            Loading test runs...
          </p>
        ) : runs.length < 2 ? (
          <div className="mt-6 rounded-lg bg-zinc-50 p-5">
            <p className="text-sm text-zinc-500">
              At least two test runs are required
              for regression detection.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleCompare}
            className="mt-6 space-y-5"
          >
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
                  onChange={(event) => {
                    setBaselineRunId(
                      event.target.value,
                    );
                    setResult(null);
                  }}
                  className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                >
                  <option value="">
                    Select baseline
                  </option>

                  {runs.map((run) => (
                    <option
                      key={run.id}
                      value={run.id}
                    >
                      {run.id} - Agent{" "}
                      {run.agentId}
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
                  onChange={(event) => {
                    setCurrentRunId(
                      event.target.value,
                    );
                    setResult(null);
                  }}
                  className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                >
                  <option value="">
                    Select current
                  </option>

                  {runs.map((run) => (
                    <option
                      key={run.id}
                      value={run.id}
                    >
                      {run.id} - Agent{" "}
                      {run.agentId}
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
                {comparing
                  ? "Comparing..."
                  : "Compare Runs"}
              </button>
            </div>
          </form>
        )}
      </section>

      {result && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-950">
            Regression Result
          </h2>

          <RegressionCard result={result} />
        </section>
      )}
    </div>
  );
}