"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getReliabilityOverview,
  type ReliabilityOverview,
  type ReliabilityTrendPoint,
} from "@/features/reliability/api";
import { getTestRuns } from "@/features/test-runs/api";

export default function ReliabilityPage() {
  const [data, setData] =
    useState<ReliabilityOverview | null>(
      null,
    );

  const [trend, setTrend] =
    useState<ReliabilityTrendPoint[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [overview, runs] =
          await Promise.all([
            getReliabilityOverview(),
            getTestRuns(),
          ]);

        setData(overview);

        const points: ReliabilityTrendPoint[] = runs
          .filter(
            (run) =>
              run.reliabilityScore !== null,
          )
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime(),
          )
          .map((run) => ({
            runId: run.id,
            score: run.reliabilityScore ?? 0,
            status: run.status,
            createdAt: run.createdAt,
          }));

        setTrend(points);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load reliability",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Reliability
        </h1>

        <p className="text-sm text-zinc-500">
          Loading reliability metrics...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Reliability
        </h1>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error ??
            "Reliability data unavailable."}
        </div>
      </div>
    );
  }

  const latestScore =
    trend.length > 0
      ? trend[trend.length - 1].score
      : data.reliabilityScore;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Reliability
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Aggregate reliability across
            recorded test runs.
          </p>
        </div>

        <Link
          href="/runs/new"
          className="w-fit rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Run Evaluation
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Reliability Score"
          value={`${data.reliabilityScore.toFixed(1)}%`}
        />

        <Metric
          label="Total Tests"
          value={String(data.totalTests)}
        />

        <Metric
          label="Passed Tests"
          value={String(data.passedTests)}
        />

        <Metric
          label="Failed Tests"
          value={String(data.failedTests)}
        />
      </section>

      <section className="rounded-xl border bg-white p-6">
        <div>
          <h2 className="font-semibold">
            Reliability Trend
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Reliability score across recorded
            evaluation runs.
          </p>
        </div>

        {trend.length === 0 ? (
          <div className="mt-6 rounded-lg bg-zinc-50 p-6 text-center">
            <p className="text-sm text-zinc-400">
              No reliability history available.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {trend.map((point) => {
              const width = Math.max(
                2,
                Math.min(100, point.score),
              );

              return (
                <div
                  key={point.runId}
                  className="rounded-lg border border-zinc-100 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Link
                        href={`/runs/${point.runId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {point.runId}
                      </Link>

                      <p className="mt-1 text-xs text-zinc-400">
                        {new Date(
                          point.createdAt,
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {point.score.toFixed(1)}%
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        {point.status}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-900 transition-all"
                      style={{
                        width: `${width}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Summary
            label="Latest Score"
            value={`${latestScore.toFixed(1)}%`}
          />

          <Summary
            label="Recorded Runs"
            value={String(
              trend.length,
            )}
          />

          <Summary
            label="Failed Tests"
            value={String(
              data.failedTests,
            )}
          />
        </div>
      </section>
    </div>
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
    <div className="rounded-xl border bg-white p-5">
      <p className="text-xs font-medium text-zinc-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 p-5">
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}