"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  getScenarios,
} from "@/features/scenarios/api";
import type {
  Scenario,
} from "@/features/scenarios/types";
import {
  createTestRun,
} from "@/features/test-runs/api";

export default function AgentTestsPage() {
  const params = useParams<{
    agentId: string;
  }>();

  const agentId = params.agentId;

  const [scenarios, setScenarios] =
    useState<Scenario[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [runningScenarioId, setRunningScenarioId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadScenarios() {
      try {
        setLoading(true);
        setError(null);

        const data =
          await getScenarios();

        setScenarios(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load scenarios",
        );
      } finally {
        setLoading(false);
      }
    }

    loadScenarios();
  }, []);

  const publishedScenarios =
    useMemo(
      () =>
        scenarios.filter(
          (scenario) =>
            scenario.status !==
            "archived",
        ),
      [scenarios],
    );

  async function handleRun(
    scenarioId: string,
  ) {
    try {
      setRunningScenarioId(
        scenarioId,
      );

      setError(null);
      setMessage(null);

      const run =
        await createTestRun({
          agentId,
          suiteId: scenarioId,
        });

      setMessage(
        `Test run ${run.testRun.id} created successfully.`,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create test run",
      );
    } finally {
      setRunningScenarioId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/agents/${agentId}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Agent
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Test Scenarios
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Select a reliability scenario and
          execute it against this agent.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-zinc-950">
              Available Scenarios
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Reliability scenarios configured
              for evaluation.
            </p>
          </div>

          <Link
            href="/scenarios"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-950"
          >
            Scenarios
          </Link>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-zinc-400">
            Loading scenarios...
          </p>
        ) : publishedScenarios.length ===
          0 ? (
          <div className="mt-6 rounded-lg bg-zinc-50 p-5">
            <p className="text-sm text-zinc-500">
              No scenarios are available.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {publishedScenarios.map(
              (scenario) => (
                <div
                  key={scenario.id}
                  className="rounded-xl border border-zinc-200 p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-zinc-950">
                        {scenario.title}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-500">
                        {scenario.userInput}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleRun(
                          scenario.id,
                        )
                      }
                      disabled={
                        runningScenarioId ===
                        scenario.id
                      }
                      className="shrink-0 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {runningScenarioId ===
                      scenario.id
                        ? "Running..."
                        : "Run Test"}
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
                      {scenario.category}
                    </span>

                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
                      {scenario.difficulty}
                    </span>

                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
                      {scenario.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-3">
                    <ScenarioList
                      title="Expected behavior"
                      items={
                        scenario.expectedBehavior
                      }
                    />

                    <ScenarioList
                      title="Forbidden behavior"
                      items={
                        scenario.forbiddenBehavior
                      }
                    />

                    <ScenarioList
                      title="Success criteria"
                      items={
                        scenario.successCriteria
                      }
                    />
                  </div>

                  {scenario.toolSteps.length >
                    0 && (
                    <div className="mt-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Tool steps
                      </p>

                      <p className="mt-2 text-sm text-zinc-700">
                        {
                          scenario.toolSteps
                            .length
                        }{" "}
                        tool step
                        {scenario.toolSteps
                          .length === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ScenarioList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </p>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">
          None specified
        </p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
          {items.map(
            (item, index) => (
              <li
                key={`${title}-${index}`}
              >
                {item}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}