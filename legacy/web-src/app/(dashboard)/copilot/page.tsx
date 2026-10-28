"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGlobalCopilotAnalysis, getAgentCopilotAnalysis } from "@/features/copilot/api";
import type { CopilotAnalysis } from "@/features/copilot/types";
import { getAgents } from "@/features/agents/api";
import type { Agent } from "@/features/agents/types";
import { getScenarios } from "@/features/scenarios/api";
import type { Scenario } from "@/features/scenarios/types";
import { AdversarialGeneratorModal } from "@/features/scenarios/components/adversarial-generator-modal";

export default function CopilotPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("global");
  const [copilot, setCopilot] = useState<CopilotAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Adversarial generator modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorScenarioId, setGeneratorScenarioId] = useState<string>("");

  async function loadData(agentId: string) {
    try {
      setLoading(true);
      setError(null);

      const [agentsData, scenariosData] = await Promise.all([
        getAgents(),
        getScenarios(),
      ]);
      setAgents(agentsData);
      setScenarios(scenariosData);

      if (scenariosData[0]) {
        setGeneratorScenarioId(scenariosData[0].id);
      }

      const analysis =
        agentId === "global"
          ? await getGlobalCopilotAnalysis()
          : await getAgentCopilotAnalysis(agentId);

      setCopilot(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Copilot analysis");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(selectedAgentId);
  }, [selectedAgentId]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-md">
              ✦
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Reliability Copilot
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-zinc-500">
            Autonomous engineering intelligence: root-cause diagnosis, risk forecasting, and recommended actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Scope:
          </label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-800 shadow-sm"
          >
            <option value="global">Global Agent Fleet</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                Agent: {ag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
          <p className="text-sm font-medium text-zinc-700">
            Synthesizing multi-dimensional reliability intelligence...
          </p>
        </div>
      ) : copilot ? (
        <div className="space-y-6">
          {/* Agent Health Score Card */}
          <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-white font-extrabold text-2xl shadow-lg">
                  {copilot.healthScore}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-900">
                      Overall Health Score
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        copilot.healthStatus === "excellent"
                          ? "bg-emerald-100 text-emerald-800"
                          : copilot.healthStatus === "good"
                            ? "bg-blue-100 text-blue-800"
                            : copilot.healthStatus === "degraded"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {copilot.healthStatus}
                    </span>
                    {copilot.isAiGenerated ? (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                        AI-POWERED
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                        DETERMINISTIC
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-600 max-w-xl leading-relaxed">
                    {copilot.summary}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsGeneratorOpen(true)}
                  disabled={scenarios.length === 0}
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 shadow-sm"
                >
                  ⚡ Generate Adversarial Tests
                </button>
                <Link
                  href="/regressions"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm"
                >
                  Run Regression Check →
                </Link>
              </div>
            </div>

            {/* Health Dimensions */}
            <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <DimensionItem label="Correctness" score={copilot.dimensions.correctness} />
              <DimensionItem label="Safety" score={copilot.dimensions.safety} />
              <DimensionItem label="Tool Reliability" score={copilot.dimensions.toolReliability} />
              <DimensionItem label="Robustness" score={copilot.dimensions.robustness} />
              <DimensionItem label="Regression Stability" score={copilot.dimensions.regressionStability} />
            </div>
          </section>

          {/* "What Changed?" Trend Banner */}
          <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-base">📈</span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  What Changed & Trend Analysis
                </h3>
                <p className="mt-0.5 text-xs text-blue-800 leading-relaxed font-medium">
                  {copilot.changeDescription}
                </p>
              </div>
            </div>
          </section>

          {/* Top Issues Grid */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-zinc-900">Prioritized Reliability Issues</h2>
            {copilot.topIssues.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-xs text-zinc-500">
                No critical or high severity issues detected in recent evaluations.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {copilot.topIssues.map((issue) => {
                  const badgeColor =
                    issue.severity === "critical"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : issue.severity === "high"
                        ? "bg-orange-100 text-orange-700 border-orange-200"
                        : "bg-amber-100 text-amber-700 border-amber-200";

                  return (
                    <div
                      key={issue.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${badgeColor}`}>
                            {issue.severity}
                          </span>
                          <h3 className="font-semibold text-sm text-zinc-900 mt-1.5">
                            {issue.title}
                          </h3>
                        </div>
                        <span className="text-[11px] font-medium text-zinc-400">
                          {issue.category}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-600 leading-relaxed">
                        {issue.description}
                      </p>

                      <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-2.5 text-[11px]">
                        <span className="font-semibold text-zinc-700">Impact: </span>
                        <span className="text-zinc-600">{issue.impact}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Root Causes & Recommendations */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Root Causes */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <span>🔍</span> Root Causes Identified
              </h2>
              <ul className="space-y-2.5">
                {copilot.rootCauses.map((cause, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl bg-zinc-50 border border-zinc-100 p-3.5 text-xs text-zinc-700 leading-relaxed"
                  >
                    <span className="font-bold text-indigo-600">•</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Recommendations */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <span>💡</span> Recommended Actions
              </h2>
              <div className="space-y-3">
                {copilot.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-emerald-950">
                        {rec.title}
                      </h4>
                      {rec.actionType === "generate_tests" ? (
                        <button
                          type="button"
                          onClick={() => setIsGeneratorOpen(true)}
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-500"
                        >
                          Generate Tests
                        </button>
                      ) : rec.actionType === "run_regression" ? (
                        <Link
                          href="/regressions"
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-500"
                        >
                          Compare Runs
                        </Link>
                      ) : (
                        <Link
                          href="/failures"
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-500"
                        >
                          View Failures
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-zinc-700">{rec.action}</p>
                    <p className="text-[11px] text-emerald-800/80 font-medium">
                      Rationale: {rec.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Suggested Tests & Next Actions */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-zinc-900">Suggested Stress Tests to Add</h2>
              <ul className="space-y-2">
                {copilot.suggestedTests.map((testConcept, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-zinc-50 border border-zinc-100 p-2.5 text-xs text-zinc-700"
                  >
                    <span className="text-indigo-600 font-bold">›</span>
                    <span>{testConcept}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-zinc-900">Next Engineering Steps</h2>
              <ul className="space-y-2">
                {copilot.nextActions.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-zinc-50 border border-zinc-100 p-2.5 text-xs text-zinc-700"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      ) : null}

      {/* Adversarial Generator Modal */}
      {isGeneratorOpen && generatorScenarioId && (
        <AdversarialGeneratorModal
          scenarioId={generatorScenarioId}
          scenarioTitle={scenarios.find((s) => s.id === generatorScenarioId)?.title}
          agentId={selectedAgentId !== "global" ? selectedAgentId : undefined}
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
        />
      )}
    </div>
  );
}

function DimensionItem({ label, score }: { label: string; score: number }) {
  const badgeColor =
    score >= 85
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : score >= 70
        ? "text-blue-700 bg-blue-50 border-blue-200"
        : score >= 50
          ? "text-amber-700 bg-amber-50 border-amber-200"
          : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
      <span className="text-[11px] font-semibold text-zinc-500 block mb-1">
        {label}
      </span>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-zinc-900">{score}%</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}>
          {score >= 70 ? "PASS" : "RISK"}
        </span>
      </div>
    </div>
  );
}
