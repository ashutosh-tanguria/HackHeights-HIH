"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAgents } from "@/features/agents/api";
import type { Agent } from "@/features/agents/types";
import { getTestRuns } from "@/features/test-runs/api";
import type { TestRun } from "@/features/test-runs/types";
import { getFailures } from "@/features/failures/api";
import type { Failure } from "@/features/failures/types";
import { getGlobalCopilotAnalysis } from "@/features/copilot/api";
import type { CopilotAnalysis } from "@/features/copilot/types";
import { getScenarios } from "@/features/scenarios/api";
import type { Scenario } from "@/features/scenarios/types";
import { AdversarialGeneratorModal } from "@/features/scenarios/components/adversarial-generator-modal";

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [copilot, setCopilot] = useState<CopilotAnalysis | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Adversarial generator modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorScenarioId, setGeneratorScenarioId] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [agentsData, runsData, failuresData, scenariosData, copilotData] =
          await Promise.all([
            getAgents(),
            getTestRuns(),
            getFailures().catch(() => []),
            getScenarios().catch(() => []),
            getGlobalCopilotAnalysis().catch(() => null),
          ]);

        setAgents(agentsData);
        setRuns(runsData);
        setFailures(failuresData);
        setScenarios(scenariosData);
        setCopilot(copilotData);

        if (scenariosData[0]) {
          setGeneratorScenarioId(scenariosData[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const openCriticalFailures = failures.filter(
    (f) => f.status === "open" && (f.severity === "critical" || f.severity === "high"),
  );

  const completedRuns = runs.filter((run) => run.status === "completed");
  const failedRuns = runs.filter((run) => run.status === "failed");

  const totalTests = runs.reduce((sum, run) => sum + run.totalTests, 0);
  const passedTests = runs.reduce((sum, run) => sum + run.passedTests, 0);
  const failedTests = runs.reduce((sum, run) => sum + run.failedTests, 0);

  const reliability =
    totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;

  const recentRuns = [...runs]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500">Loading reliability control center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Agent Reliability Control Center
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Continuous evaluation, deterministic boundary testing, and reliability intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsGeneratorOpen(true)}
            disabled={scenarios.length === 0}
            className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 shadow-sm"
          >
            ⚡ Generate Adversarial Tests
          </button>
          <Link
            href="/copilot"
            className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-sm"
          >
            ✦ Open Copilot
          </Link>
          <Link
            href="/runs/new"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 shadow-sm"
          >
            Run Evaluation ↵
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Primary Health & Risk Control Center */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Fleet Health Score
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900">
              {copilot ? copilot.healthScore : reliability}%
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                (copilot?.healthScore ?? reliability) >= 80
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {copilot?.healthStatus ?? "ACTIVE"}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Across {agents.length} active agents</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Regression Risk
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900">
              {failedRuns.length > 0 ? "Elevated" : "Low"}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {failedRuns.length} unstable runs in history
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Attention Required
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${
                openCriticalFailures.length > 0 ? "text-red-600" : "text-zinc-900"
              }`}
            >
              {openCriticalFailures.length}
            </span>
            <span className="text-xs text-zinc-500">Critical / High Failures</span>
          </div>
          <Link
            href="/failures"
            className="mt-2 inline-block text-xs font-medium text-red-700 hover:text-red-900 underline"
          >
            Review open failures →
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Total Evaluations
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900">
              {totalTests}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {passedTests} passed
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">In {runs.length} test runs</p>
        </div>
      </section>

      {/* AI Reliability Insights Banner */}
      {copilot && (
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm">
                ✦
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Reliability Copilot Insight
                </h3>
                <p className="mt-0.5 text-xs text-zinc-700 leading-relaxed font-medium max-w-2xl">
                  {copilot.summary}
                </p>
              </div>
            </div>
            <Link
              href="/copilot"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 self-start sm:self-auto shadow-sm"
            >
              Open Full Briefing →
            </Link>
          </div>
        </section>
      )}

      {/* Agent Overview & Recent Activity */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-zinc-900">Agent Fleet Reliability</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Live performance and pass rate by agent.
              </p>
            </div>
            <Link
              href="/agents"
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-950"
            >
              View all ({agents.length})
            </Link>
          </div>

          {agents.length === 0 ? (
            <div className="mt-6 rounded-xl bg-zinc-50 p-6 text-center border border-zinc-100">
              <p className="text-xs text-zinc-400">No agents registered yet.</p>
              <Link
                href="/agents/new"
                className="mt-2 inline-block text-xs font-semibold text-zinc-900 underline"
              >
                Connect an agent
              </Link>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-zinc-100">
              {agents.slice(0, 5).map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0 hover:bg-zinc-50/50 rounded-lg px-2 transition"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {agent.name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {agent.totalTests} evaluations · {agent.failedTests} failures
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                        (agent.reliabilityScore ?? 100) >= 80
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {agent.reliabilityScore === null ? "100%" : `${agent.reliabilityScore}%`}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-zinc-900">Recent Test Executions</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Latest evaluations run against scenarios.
              </p>
            </div>
            <Link
              href="/runs"
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-950"
            >
              View all ({runs.length})
            </Link>
          </div>

          {recentRuns.length === 0 ? (
            <div className="mt-6 rounded-xl bg-zinc-50 p-6 text-center border border-zinc-100">
              <p className="text-xs text-zinc-400">No test runs executed yet.</p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-zinc-100">
              {recentRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/runs/${run.id}`}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0 hover:bg-zinc-50/50 rounded-lg px-2 transition"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      Run {run.id.slice(0, 8)}...
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {new Date(run.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        run.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : run.status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Adversarial Generator Modal */}
      {isGeneratorOpen && generatorScenarioId && (
        <AdversarialGeneratorModal
          scenarioId={generatorScenarioId}
          scenarioTitle={scenarios.find((s) => s.id === generatorScenarioId)?.title}
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
        />
      )}
    </div>
  );
}