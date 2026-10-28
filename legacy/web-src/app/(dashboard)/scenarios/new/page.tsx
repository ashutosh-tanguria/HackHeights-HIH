"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScenarioForm } from "@/features/scenarios/components/scenario-form";
import { createScenario } from "@/features/scenarios/api";

export default function NewScenarioPage() {
  const router = useRouter();

  const [error, setError] =
    useState<string | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  async function handleSubmit(data: {
    title: string;
    category:
      | "basic_reliability"
      | "tool_safety"
      | "adversarial"
      | "prompt_injection"
      | "destructive_action";
    difficulty:
      | "easy"
      | "medium"
      | "hard"
      | "critical";
    userInput: string;
    expectedBehavior: string[];
    forbiddenBehavior: string[];
    successCriteria: string[];
  }) {
    try {
      setSubmitting(true);
      setError(null);

      await createScenario({
        title: data.title,
        category: data.category,
        difficulty: data.difficulty,
        userInput: data.userInput,
        expectedBehavior:
          data.expectedBehavior,
        forbiddenBehavior:
          data.forbiddenBehavior,
        successCriteria:
          data.successCriteria,
        toolSteps: [],
      });

      router.push("/scenarios");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create scenario",
      );
    } finally {
      setSubmitting(false);
    }
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

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Create Scenario
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Define a new evaluation scenario for your agents.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="font-medium text-red-700">
            Failed to create scenario
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
          onSubmit={handleSubmit}
        />
      </div>

      {submitting && (
        <p className="text-center text-sm text-zinc-500">
          Creating scenario...
        </p>
      )}
    </div>
  );
}