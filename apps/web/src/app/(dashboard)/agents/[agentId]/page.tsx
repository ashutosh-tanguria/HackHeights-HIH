"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAgent } from "@/features/agents/api";
import type { Agent } from "@/features/agents/types";
import { getTestRuns } from "@/features/test-runs/api";
import type { TestRun } from "@/features/test-runs/types";
import { getHealthScore } from "@/features/copilot/api";
import type { AgentHealthScore } from "@/features/copilot/types";
import { getScenarios } from "@/features/scenarios/api";
import type { Scenario } from "@/features/scenarios/types";
import { AdversarialGeneratorModal } from "@/features/scenarios/components/adversarial-generator-modal";

export default function AgentDetailPage() {
  const params = useParams<{ agentId: string }>();
  const agentId = params.agentId;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [health, setHealth] = useState<AgentHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Adversarial generator modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("");

  useEffect(() => {
    async function load() {
      if (!agentId) return;

      try {
        setLoading(true);
        setError(null);

        const [agentData, runData, scenariosData, healthData] = await Promise.all([
          getAgent(agentId),
          getTestRuns(),
          getScenarios(),
          getHealthScore(agentId).catch(() => null),
        ]);

        setAgent(agentData);
        setRuns(runData.filter((run) => run.agentId === agentId));
        setScenarios(scenariosData);
        setHealth(healthData);
        if (scenariosData[0]) {
          setSelectedScenarioId(scenariosData[0].id);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load agent",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [agentId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link href="/agents" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Back to agents
        </Link>
        <p className="text-sm text-zinc-500">Loading agent intelligence...</p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="space-y-4">
        <Link href="/agents" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Back to agents
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error ?? "Agent not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/agents" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Back to agents
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">{agent.name}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  agent.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {agent.status.toUpperCase()}
              </span>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm text-zinc-500">
              {agent.description || "No description provided."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsGeneratorOpen(true)}
              disabled={scenarios.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 shadow-sm"
            >
              <span>⚡</span> Generate Adversarial Tests
            </button>

            <Link
              href={`/runs/new?agentId=${agent.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 shadow-sm"
            >
              Run Evaluation ↵
            </Link>
          </div>
        </div>
      </div>

      {/* Multidimensional Health Intelligence Section */}
      {health && (
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white font-bold text-lg shadow-sm">
                {health.overallScore}
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Multidimensional Agent Health
                </h2>
                <p className="text-xs text-zinc-500">
                  Status: <strong className="uppercase text-indigo-700">{health.status}</strong> · Calculated from {health.totalEvaluations} evaluations
                </p>
              </div>
            </div>

            <Link
              href="/copilot"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
            >
              <span>✦</span> View Copilot Intelligence Briefing →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <DimensionScore label="Correctness" value={health.dimensions.correctness} />
            <DimensionScore label="Safety" value={health.dimensions.safety} />
            <DimensionScore label="Tool Reliability" value={health.dimensions.toolReliability} />
            <DimensionScore label="Robustness" value={health.dimensions.robustness} />
            <DimensionScore label="Regression Stability" value={health.dimensions.regressionStability} />
          </div>
        </section>
      )}

      {/* Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Reliability Score"
          value={agent.reliabilityScore === null ? "-" : `${agent.reliabilityScore}%`}
        />
        <Metric label="Total Evaluations" value={String(agent.totalTests)} />
        <Metric label="Passed Tests" value={String(agent.passedTests)} />
        <Metric label="Failed Tests" value={String(agent.failedTests)} />
      </section>

      {/* Recent Runs List */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-zinc-900">Recent Test Executions</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Historical evaluation runs and benchmark verdicts.
            </p>
          </div>

          <Link
            href={`/agents/${agent.id}/runs`}
            className="text-xs font-semibold text-zinc-700 hover:text-zinc-950"
          >
            View all ({runs.length})
          </Link>
        </div>

        {runs.length === 0 ? (
          <div className="mt-6 rounded-lg bg-zinc-50 p-6 text-center border border-zinc-100">
            <p className="text-sm text-zinc-500 font-medium">No test runs recorded yet.</p>
            <p className="mt-1 text-xs text-zinc-400">
              Pair this agent with a scenario to run an evaluation.
            </p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-zinc-100">
            {runs.slice(0, 5).map((run) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0 hover:bg-zinc-50/50 rounded-lg px-2 transition"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Run {run.id.slice(0, 8)}...
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Scenario: {run.suiteId.slice(0, 8)}... · {new Date(run.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      run.status === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {run.reliabilityScore === null ? run.status : `${run.reliabilityScore}%`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Configuration */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">Connection & Endpoint</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
          <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-3">
            <span className="font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
              Integration Protocol
            </span>
            <span className="font-medium text-zinc-800 text-sm">{agent.integration}</span>
          </div>

          <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-3">
            <span className="font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
              Model
            </span>
            <span className="font-medium text-zinc-800 text-sm">{agent.model ?? "Default / Local"}</span>
          </div>

          <div className="sm:col-span-2 rounded-lg bg-zinc-50 border border-zinc-100 p-3">
            <span className="font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
              Target HTTP Webhook Endpoint
            </span>
            <span className="font-mono text-zinc-800 break-all">{agent.endpoint ?? "Not configured"}</span>
          </div>
        </div>
      </section>

      {/* Adversarial Generator Modal */}
      {isGeneratorOpen && selectedScenarioId && (
        <AdversarialGeneratorModal
          scenarioId={selectedScenarioId}
          scenarioTitle={scenarios.find((s) => s.id === selectedScenarioId)?.title}
          agentId={agent.id}
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
        />
      )}
    </div>
  );
}

function DimensionScore({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const color =
    value >= 85
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : value >= 70
        ? "text-blue-700 bg-blue-50 border-blue-200"
        : value >= 50
          ? "text-amber-700 bg-amber-50 border-amber-200"
          : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
      <span className="text-[11px] font-semibold text-zinc-500 block mb-1">
        {label}
      </span>
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold text-zinc-900">{value}%</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${color}`}>
          {value >= 70 ? "PASS" : "RISK"}
        </span>
      </div>
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
        {value}
      </p>
    </div>
  );
}