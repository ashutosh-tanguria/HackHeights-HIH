"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAgents } from "@/features/agents/api";
import { getScenarios } from "@/features/scenarios/api";
import { createTestRun } from "@/features/test-runs/api";
import type { Agent } from "@/features/agents/types";
import type { Scenario } from "@/features/scenarios/types";

export default function NewTestRunPage() {
  const [agents, setAgents] =
    useState<Agent[]>([]);

  const [scenarios, setScenarios] =
    useState<Scenario[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [
          loadedAgents,
          loadedScenarios,
        ] = await Promise.all([
          getAgents(),
          getScenarios(),
        ]);

        setAgents(loadedAgents);
        setScenarios(loadedScenarios);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load test run data",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(
      event.currentTarget,
    );

    const agentId = String(
      formData.get("agentId") ?? "",
    );

    const suiteId = String(
      formData.get("suiteId") ?? "",
    );

    if (!agentId || !suiteId) {
      setError(
        "Select an agent and scenario.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result =
        await createTestRun({
          agentId,
          suiteId,
        });

      window.location.href =
        `/runs/${result.testRun.id}`;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to execute test run",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-zinc-500">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/runs"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Test Runs
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          New Test Run
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Select an agent and scenario to
          execute the reliability pipeline.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="rounded-xl border bg-white p-6">
          <div>
            <h2 className="font-semibold">
              Agent
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Choose the agent that will receive
              the scenario.
            </p>
          </div>

          <select
            name="agentId"
            required
            defaultValue=""
            className="mt-5 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          >
            <option value="" disabled>
              Select an agent
            </option>

            {agents.map((agent) => (
              <option
                key={agent.id}
                value={agent.id}
              >
                {agent.name}
              </option>
            ))}
          </select>

          {agents.length === 0 && (
            <p className="mt-3 text-xs text-zinc-400">
              No agents available. Create an
              agent first.
            </p>
          )}
        </section>

        <section className="rounded-xl border bg-white p-6">
          <div>
            <h2 className="font-semibold">
              Scenario
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Choose the evaluation scenario.
            </p>
          </div>

          <select
            name="suiteId"
            required
            defaultValue=""
            className="mt-5 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
          >
            <option value="" disabled>
              Select a scenario
            </option>

            {scenarios.map((scenario) => (
              <option
                key={scenario.id}
                value={scenario.id}
              >
                {scenario.title}
              </option>
            ))}
          </select>

          {scenarios.length === 0 && (
            <p className="mt-3 text-xs text-zinc-400">
              No scenarios available. Create a
              scenario first.
            </p>
          )}
        </section>

        <div className="flex justify-end gap-3">
          <Link
            href="/runs"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              submitting ||
              agents.length === 0 ||
              scenarios.length === 0
            }
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Running..."
              : "Run Evaluation"}
          </button>
        </div>
      </form>
    </div>
  );
}