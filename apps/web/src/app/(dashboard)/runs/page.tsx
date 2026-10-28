"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTestRuns } from "@/features/test-runs/api";
import type { TestRun } from "@/features/test-runs/types";
import { RunList } from "@/features/test-runs/components/run-list";

export default function RunsPage() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRuns() {
      try {
        setLoading(true);
        setError(null);
        const data = await getTestRuns();
        setRuns(data);
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
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Test Runs
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Review agent executions, evaluation
            results, failures, and traces.
          </p>
        </div>

        <Link
          href="/runs/new"
          className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          New Test Run
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-zinc-400">
          Loading test runs...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <RunList runs={runs} />
      )}
    </div>
  );
}