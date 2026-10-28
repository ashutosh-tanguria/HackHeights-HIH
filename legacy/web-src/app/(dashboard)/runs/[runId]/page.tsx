"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getTestRun,
  getTestRunResults,
  getTestRunFailures,
  getTestRunTrace,
} from "@/features/test-runs/api";
import type {
  ExecutionTrace,
  TestResult,
  TestRun,
} from "@/features/test-runs/types";
import type { Failure } from "@/features/failures/types";

export default function RunDetailsPage() {
  const params = useParams<{ runId: string }>();
  const runId = params.runId;

  const [run, setRun] = useState<TestRun | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!runId) return;

      try {
        setLoading(true);
        setError(null);

        const runData = await getTestRun(runId);
        setRun(runData);

        const [resultsData, failuresData] = await Promise.all([
          getTestRunResults(runId),
          getTestRunFailures(runId),
        ]);

        setResults(resultsData);
        setFailures(failuresData);

        if (runData.traceId) {
          const traceData = await getTestRunTrace(runId, runData.traceId);
          setTrace(traceData);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load test run details",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [runId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link
          href="/runs"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to runs
        </Link>
        <p className="text-sm text-zinc-500">Loading test run details...</p>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="space-y-4">
        <Link
          href="/runs"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to runs
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error || "Test run not found."}
        </div>
      </div>
    );
  }

  const primaryFailure = failures[0] ?? null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/runs"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to runs
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Test Run</h1>
            <p className="mt-1 break-all text-xs font-mono text-zinc-400">
              {run.id}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span>Agent: <strong className="text-zinc-700">{run.agentId.slice(0, 8)}...</strong></span>
              <span>Scenario: <strong className="text-zinc-700">{run.suiteId.slice(0, 8)}...</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                run.status === "completed"
                  ? "bg-emerald-100 text-emerald-800"
                  : run.status === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-zinc-100 text-zinc-800"
              }`}
            >
              {run.status.toUpperCase()}
            </span>
            <Link
              href="/copilot"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              ✦ Copilot Briefing
            </Link>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          label="Reliability Score"
          value={
            run.reliabilityScore === null
              ? "-"
              : `${run.reliabilityScore}%`
          }
          highlight={run.reliabilityScore !== null && run.reliabilityScore >= 70}
        />
        <Metric label="Total Tests" value={String(run.totalTests)} />
        <Metric label="Passed" value={String(run.passedTests)} />
        <Metric label="Failed" value={String(run.failedTests)} />
        <Metric
          label="Duration"
          value={run.durationMs === null ? "-" : `${run.durationMs} ms`}
        />
      </section>

      {/* Intelligent Failure Summary Card */}
      {primaryFailure && (
        <section className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/60 via-white to-amber-50/40 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                !
              </span>
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Intelligent Failure Diagnosis
                </h2>
                <p className="text-xs text-zinc-500">
                  Automated root cause identification and recommended actions
                </p>
              </div>
            </div>
            <Link
              href="/failures"
              className="text-xs font-semibold text-red-700 hover:text-red-900 underline"
            >
              View in Failures Hub →
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Primary Failure
              </span>
              <p className="mt-1 font-semibold text-sm text-zinc-900">
                {primaryFailure.title}
              </p>
              <span className="mt-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                {primaryFailure.severity.toUpperCase()}
              </span>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Root Cause
              </span>
              <p className="mt-1 text-xs leading-relaxed text-zinc-700">
                {primaryFailure.description}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Recommended Action
              </span>
              <p className="mt-1 text-xs leading-relaxed text-emerald-950 font-medium">
                {primaryFailure.type === "unsafe_action"
                  ? "Require explicit user confirmation gate before executing irreversible tools."
                  : primaryFailure.type === "prompt_injection"
                    ? "Enforce strict input boundary isolation and reject roleplay override attempts."
                    : primaryFailure.type === "hallucinated_success"
                      ? "Instruct model never to claim task completion without verified tool results."
                      : "Refine system instructions to satisfy all scenario criteria."}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Test Results */}
      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold text-zinc-900">Evaluation Criteria & Results</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Individual criteria verdicts produced by the evaluation engine.
        </p>

        {results.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-400">No test results recorded.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {results.map((result) => (
              <div key={result.id} className="rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      Scenario Verification Result
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Evaluated: {new Date(result.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      result.status === "passed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {result.status.toUpperCase()} ({result.score ?? 0}%)
                  </span>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <BehaviorList
                    title="Expected Behaviors"
                    items={result.expectedBehavior}
                  />
                  <BehaviorList
                    title="Observed Agent Behavior"
                    items={result.actualBehavior}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Execution Trace & Step Timeline */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-zinc-900">
              Chronological Execution Trace Timeline
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Auditable event timeline with step-level evidence replay.
            </p>
          </div>
          {trace && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
              {trace.events.length} Events Captured
            </span>
          )}
        </div>

        {!trace || trace.events.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-400">
            No execution trace available for this test run.
          </p>
        ) : (
          <div className="mt-6 relative pl-6 border-l-2 border-zinc-200 space-y-6">
            {trace.events.map((event, index) => {
              const isFailingStep =
                primaryFailure &&
                (event.type === "tool_call" && primaryFailure.type === "unsafe_action" ||
                  event.type === "agent" && primaryFailure.type === "hallucinated_success" ||
                  event.type === "evaluation");

              return (
                <div key={event.id || index} className="relative group">
                  {/* Timeline dot */}
                  <span
                    className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 bg-white ${
                      isFailingStep
                        ? "border-red-600 bg-red-50"
                        : "border-zinc-400 group-hover:border-zinc-900"
                    }`}
                  />

                  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-zinc-900">
                          {event.name}
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-600">
                          {event.type}
                        </span>
                        {isFailingStep && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                            Failure Occurred Here
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        {event.durationMs !== undefined && (
                          <span>{event.durationMs} ms</span>
                        )}
                        <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {event.input !== undefined && (
                      <TraceData label="Input Payload" value={event.input} />
                    )}

                    {event.output !== undefined && (
                      <TraceData label="Response / Output" value={event.output} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-6 text-xs text-zinc-400">
        <span>Created: {new Date(run.createdAt).toLocaleString()}</span>
        {run.startedAt && <span>Started: {new Date(run.startedAt).toLocaleString()}</span>}
        {run.completedAt && <span>Completed: {new Date(run.completedAt).toLocaleString()}</span>}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "bg-emerald-50/50 border-emerald-200" : "bg-zinc-50 border-zinc-200"}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}

function BehaviorList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">None recorded.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="rounded-lg bg-zinc-50 border border-zinc-100 p-3 text-xs leading-relaxed text-zinc-700"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TraceData({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
        {label}
      </p>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-50 border border-zinc-100 p-3 text-xs leading-relaxed font-mono text-zinc-800">
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}