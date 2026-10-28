"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getScenario,
  updateScenario,
} from "@/features/scenarios/api";
import { ScenarioForm } from "@/features/scenarios/components/scenario-form";
import type { Scenario } from "@/features/scenarios/types";

export default function EditScenarioPage() {
  const params = useParams<{ scenarioId: string }>();
  const router = useRouter();

  const [scenario, setScenario] =
    useState<Scenario | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadScenario() {
      try {
        setLoading(true);
        setError(null);

        const data = await getScenario(
          params.scenarioId,
        );

        setScenario(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load scenario",
        );
      } finally {
        setLoading(false);
      }
    }

    loadScenario();
  }, [params.scenarioId]);

  async function handleSubmit(data: {
    title: string;
    category: Scenario["category"];
    difficulty: Scenario["difficulty"];
    userInput: string;
    expectedBehavior: string[];
    forbiddenBehavior: string[];
    successCriteria: string[];
    toolSteps: Scenario["toolSteps"];
  }) {
    try {
      setSubmitting(true);
      setError(null);

      await updateScenario(
        params.scenarioId,
        data,
      );

      router.push(
        `/scenarios/${params.scenarioId}`,
      );
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update scenario",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-zinc-500">
          Loading scenario...
        </p>
      </div>
    );
  }

  if (error && !scenario) {
    return (
      <div className="space-y-4">
        <Link
          href="/scenarios"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Scenarios
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">
            Failed to load scenario
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/scenarios/${scenario.id}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Scenario
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Edit Scenario
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Update the evaluation contract for this scenario.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="font-medium text-red-700">
            Failed to update scenario
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        </div>
      )}

      <div
        className={
          submitting
            ? "pointer-events-none opacity-60"
            : ""
        }
      >
        <ScenarioForm
          initialData={scenario}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
        />
      </div>

      {submitting && (
        <p className="text-center text-sm text-zinc-500">
          Saving changes...
        </p>
      )}
    </div>
  );
}