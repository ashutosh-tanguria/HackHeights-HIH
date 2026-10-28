"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getScenario } from "@/features/scenarios/api";
import type { Scenario } from "@/features/scenarios/types";
import { DeleteScenarioButton } from "@/features/scenarios/components/delete-scenario-button";
import { AdversarialGeneratorModal } from "@/features/scenarios/components/adversarial-generator-modal";

export default function ScenarioPage() {
  const params = useParams<{ scenarioId: string }>();
  const scenarioId = params.scenarioId;

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if (!scenarioId) return;

      try {
        setLoading(true);
        setError(null);

        const data = await getScenario(scenarioId);
        setScenario(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load scenario",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [scenarioId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link
          href="/scenarios"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Scenarios
        </Link>
        <p className="text-sm text-zinc-500">Loading scenario...</p>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="space-y-4">
        <Link
          href="/scenarios"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Scenarios
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error || "Scenario not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/scenarios"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Scenarios
        </Link>

        <div className="mt-4 flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {scenario.title}
              </h1>

              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium">
                {scenario.status}
              </span>
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              {scenario.category.replaceAll("_", " ")} ·{" "}
              {scenario.difficulty}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsGeneratorOpen(true)}
              className="rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 shadow-sm"
            >
              ⚡ Generate Adversarial Tests
            </button>

            <Link
              href={`/scenarios/${scenario.id}/edit`}
              className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Edit Scenario
            </Link>

            <DeleteScenarioButton scenarioId={scenario.id} />
          </div>
        </div>
      </div>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold">
          User Input
        </h2>

        <p className="mt-3 rounded-lg bg-zinc-50 p-4 text-sm leading-6">
          {scenario.userInput}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">
            Expected Behavior
          </h2>

          <ul className="mt-4 space-y-3">
            {scenario.expectedBehavior.map(
              (item, index) => (
                <li
                  key={index}
                  className="rounded-lg bg-zinc-50 p-3 text-sm"
                >
                  {item}
                </li>
              ),
            )}
          </ul>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">
            Forbidden Behavior
          </h2>

          {scenario.forbiddenBehavior.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {scenario.forbiddenBehavior.map(
                (item, index) => (
                  <li
                    key={index}
                    className="rounded-lg bg-zinc-50 p-3 text-sm"
                  >
                    {item}
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-400">
              No forbidden behavior defined.
            </p>
          )}
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">
            Success Criteria
          </h2>

          <ul className="mt-4 space-y-3">
            {scenario.successCriteria.map(
              (item, index) => (
                <li
                  key={index}
                  className="rounded-lg bg-zinc-50 p-3 text-sm"
                >
                  {item}
                </li>
              ),
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Tool Steps
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Tools available to this evaluation scenario.
          </p>
        </div>

        {scenario.toolSteps.length > 0 ? (
          <div className="divide-y">
            {scenario.toolSteps.map(
              (step, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-6 px-6 py-4"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Step {index + 1}
                    </p>

                    <p className="mt-1 font-mono text-xs text-zinc-500">
                      {step.tool}
                    </p>
                  </div>

                  <pre className="max-w-xl overflow-x-auto rounded-lg bg-zinc-50 p-3 text-xs">
                    {JSON.stringify(
                      step.input,
                      null,
                      2,
                    )}
                  </pre>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="flex min-h-32 items-center justify-center">
            <p className="text-sm text-zinc-400">
              No tool steps configured.
            </p>
          </div>
        )}
      </section>

      <div className="text-xs text-zinc-400">
        Created{" "}
        {new Date(
          scenario.createdAt,
        ).toLocaleString()}
        {" · "}
        Updated{" "}
        {new Date(
          scenario.updatedAt,
        ).toLocaleString()}
      </div>

      {isGeneratorOpen && (
        <AdversarialGeneratorModal
          scenarioId={scenario.id}
          scenarioTitle={scenario.title}
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
        />
      )}
    </div>
  );
}