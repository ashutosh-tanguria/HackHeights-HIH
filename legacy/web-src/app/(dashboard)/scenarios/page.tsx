"use client";

import Link from "next/link";
import { ScenarioCard } from "@/features/scenarios/components/scenario-card";
import { useScenarios } from "@/features/scenarios/hooks/use-scenarios";

export default function ScenariosPage() {
  const {
    scenarios,
    loading,
    error,
  } = useScenarios();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Evaluation Management
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Scenarios
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Define reliability scenarios for evaluating AI agents.
          </p>
        </div>

        <Link
          href="/scenarios/new"
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Add Scenario
        </Link>
      </div>

      <section className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Evaluation Scenarios
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Scenarios used to test agent reliability.
          </p>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex min-h-64 items-center justify-center">
              <p className="text-sm text-zinc-500">
                Loading scenarios...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <p className="font-medium text-red-600">
                  Failed to load scenarios
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  {error}
                </p>
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            scenarios.length === 0 && (
              <div className="flex min-h-64 items-center justify-center">
                <div className="text-center">
                  <p className="font-medium">
                    No scenarios yet
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Create your first scenario to start evaluating agents.
                  </p>

                  <Link
                    href="/scenarios/new"
                    className="mt-4 inline-block rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                  >
                    Create your first scenario
                  </Link>
                </div>
              </div>
            )}

          {!loading &&
            !error &&
            scenarios.length > 0 && (
              <div className="grid gap-4">
                {scenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                  />
                ))}
              </div>
            )}
        </div>
      </section>
    </div>
  );
}