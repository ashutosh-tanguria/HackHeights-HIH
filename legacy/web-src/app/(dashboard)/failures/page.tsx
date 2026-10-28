"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getFailures,
  updateFailure,
  getFailureDiagnosis,
  triggerFailureDiagnosis,
} from "@/features/failures/api";
import type {
  Failure,
  FailureSeverity,
  FailureStatus,
  FailureDiagnosis,
} from "@/features/failures/types";
import { AdversarialGeneratorModal } from "@/features/scenarios/components/adversarial-generator-modal";

export default function FailuresPage() {
  const [failures, setFailures] = useState<Failure[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | FailureStatus>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | FailureSeverity>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Adversarial generator modal state
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [activeScenarioTitle, setActiveScenarioTitle] = useState<string>("");

  async function loadFailures() {
    try {
      setLoading(true);
      setError(null);
      const data = await getFailures();
      setFailures(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load failures",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFailures();
  }, []);

  async function handleStatusChange(
    failureId: string,
    status: FailureStatus,
  ) {
    try {
      const updated = await updateFailure(failureId, status);
      setFailures((current) =>
        current.map((failure) =>
          failure.id === failureId ? updated : failure,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update failure",
      );
    }
  }

  const filteredFailures = failures.filter((failure) => {
    const matchesStatus =
      statusFilter === "all" || failure.status === statusFilter;
    const matchesSeverity =
      severityFilter === "all" || failure.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Failures</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Review reliability failures, AI root-cause diagnoses, and recommended fixes.
          </p>
        </div>
        <Link
          href="/copilot"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 self-start"
        >
          <span>✦</span> Open Reliability Copilot
        </Link>
      </div>

      <section className="rounded-xl border bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | FailureStatus)
            }
            className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>

          <select
            value={severityFilter}
            onChange={(event) =>
              setSeverityFilter(event.target.value as "all" | FailureSeverity)
            }
            className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm"
          >
            <option value="all">All severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <div className="ml-auto flex items-center text-sm text-zinc-500">
            {filteredFailures.length} failure
            {filteredFailures.length === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white p-10 text-center">
          <p className="text-sm text-zinc-400">Loading failures...</p>
        </div>
      ) : filteredFailures.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center">
          <p className="text-sm font-medium text-zinc-700">No failures found</p>
          <p className="mt-1 text-sm text-zinc-400">
            All evaluated agents are currently meeting reliability contracts.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFailures.map((failure) => (
            <EnhancedFailureCard
              key={failure.id}
              failure={failure}
              onStatusChange={handleStatusChange}
              onOpenGenerator={(scenarioId, title) => {
                setActiveScenarioId(scenarioId);
                setActiveScenarioTitle(title);
              }}
            />
          ))}
        </div>
      )}

      {activeScenarioId && (
        <AdversarialGeneratorModal
          scenarioId={activeScenarioId}
          scenarioTitle={activeScenarioTitle}
          isOpen={Boolean(activeScenarioId)}
          onClose={() => setActiveScenarioId(null)}
        />
      )}
    </div>
  );
}

function EnhancedFailureCard({
  failure,
  onStatusChange,
  onOpenGenerator,
}: {
  failure: Failure;
  onStatusChange: (failureId: string, status: FailureStatus) => void;
  onOpenGenerator: (scenarioId: string, title: string) => void;
}) {
  const [diagnosis, setDiagnosis] = useState<FailureDiagnosis | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [diagError, setDiagError] = useState<string | null>(null);

  async function fetchDiagnosis(force = false) {
    try {
      setLoadingDiagnosis(true);
      setDiagError(null);
      const data = force
        ? await triggerFailureDiagnosis(failure.id)
        : await getFailureDiagnosis(failure.id);
      setDiagnosis(data);
      setShowDiagnosis(true);
    } catch (err) {
      setDiagError(
        err instanceof Error ? err.message : "AI diagnosis unavailable",
      );
      setShowDiagnosis(true);
    } finally {
      setLoadingDiagnosis(false);
    }
  }

  const severityClass =
    failure.severity === "critical"
      ? "bg-red-100 text-red-700 border-red-200"
      : failure.severity === "high"
        ? "bg-orange-100 text-orange-700 border-orange-200"
        : failure.severity === "medium"
          ? "bg-amber-100 text-amber-700 border-amber-200"
          : "bg-zinc-100 text-zinc-600 border-zinc-200";

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-lg text-zinc-900">{failure.title}</h2>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${severityClass}`}
            >
              {failure.severity.toUpperCase()}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
              {failure.status}
            </span>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {failure.type.replace(/_/g, " ")}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {failure.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-400">
            <Link
              href={`/runs/${failure.runId}`}
              className="text-zinc-600 hover:text-zinc-900 font-medium underline"
            >
              Run: {failure.runId.slice(0, 8)}...
            </Link>
            <span>Scenario: {failure.scenarioId.slice(0, 8)}...</span>
            <span>Evaluator: {failure.evaluator}</span>
            <span>Recorded: {new Date(failure.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={failure.status}
            onChange={(event) =>
              onStatusChange(failure.id, event.target.value as FailureStatus)
            }
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700"
          >
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>
      </div>

      {/* Expected vs Actual Behavior */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Behavior title="Expected Behavior" items={failure.expectedBehavior} />
        <Behavior title="Actual Behavior" items={failure.actualBehavior} />
      </div>

      {/* Evidence */}
      {failure.evidence.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Observed Evidence
          </p>
          <div className="mt-2 rounded-lg bg-zinc-50 border border-zinc-100 p-3 text-xs text-zinc-700 font-mono">
            {failure.evidence.map((ev, i) => (
              <div key={i}>• {typeof ev === "string" ? ev : JSON.stringify(ev)}</div>
            ))}
          </div>
        </div>
      )}

      {/* AI Failure Diagnosis Section */}
      <div className="mt-6 pt-5 border-t border-zinc-100">
        {!showDiagnosis ? (
          <button
            type="button"
            onClick={() => fetchDiagnosis()}
            disabled={loadingDiagnosis}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/70 px-4 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition"
          >
            <span>✦</span>
            {loadingDiagnosis ? "Analyzing Root Cause..." : "View AI Failure Diagnosis"}
          </button>
        ) : (
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] text-white">
                  ✦
                </span>
                <h3 className="text-sm font-semibold text-zinc-900">
                  AI Failure Diagnosis & Root Cause
                </h3>
                {diagnosis?.isAiGenerated ? (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                    AI-POWERED
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                    HEURISTIC ENGINE
                  </span>
                )}
              </div>
              <button
                onClick={() => fetchDiagnosis(true)}
                disabled={loadingDiagnosis}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {loadingDiagnosis ? "Refreshing..." : "Re-diagnose"}
              </button>
            </div>

            {diagError && (
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                AI Diagnosis Notice: {diagError}. Displaying deterministic failure breakdown.
              </div>
            )}

            {diagnosis && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="font-semibold text-zinc-900">Root Cause: </span>
                  <span className="text-zinc-700 leading-relaxed">{diagnosis.rootCause}</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 pt-1">
                  <div className="rounded-lg bg-white border border-zinc-200 p-2.5">
                    <span className="font-semibold text-zinc-500 block text-[10px] uppercase">
                      Execution Step
                    </span>
                    <span className="font-medium text-zinc-800">{diagnosis.executionStep}</span>
                  </div>
                  <div className="rounded-lg bg-white border border-zinc-200 p-2.5">
                    <span className="font-semibold text-zinc-500 block text-[10px] uppercase">
                      Confidence Score
                    </span>
                    <span className="font-medium text-zinc-800">
                      {Math.round(diagnosis.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {diagnosis.affectedCriteria.length > 0 && (
                  <div>
                    <span className="font-semibold text-zinc-900 block mb-1">
                      Affected Success Criteria:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-zinc-600 pl-1">
                      {diagnosis.affectedCriteria.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-3">
                  <span className="font-semibold text-emerald-900 block mb-1">
                    Recommended Engineering Fix:
                  </span>
                  <p className="text-emerald-800 leading-relaxed">{diagnosis.recommendation}</p>
                </div>

                {diagnosis.suggestedTests.length > 0 && (
                  <div>
                    <span className="font-semibold text-zinc-900 block mb-1">
                      Suggested Prevention Tests:
                    </span>
                    <ul className="space-y-1">
                      {diagnosis.suggestedTests.map((st, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-zinc-600 bg-white rounded border border-zinc-100 px-2 py-1"
                        >
                          <span className="text-indigo-500 font-bold">›</span> {st}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onOpenGenerator(failure.scenarioId, failure.title)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <span>⚡</span> Generate Adversarial Tests
          </button>
          <Link
            href={`/runs/${failure.runId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <span>🔍</span> View Trace Timeline
          </Link>
        </div>

        <Link
          href={`/runs/new?scenarioId=${failure.scenarioId}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
        >
          Run Again ↵
        </Link>
      </div>
    </section>
  );
}

function Behavior({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </p>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">None recorded.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="rounded-lg bg-zinc-50 border border-zinc-100 p-2.5 text-xs leading-5 text-zinc-700"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}