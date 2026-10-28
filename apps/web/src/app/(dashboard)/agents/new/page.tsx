"use client";

import Link from "next/link";
import { useState } from "react";
import { createAgent } from "@/features/agents/api";
import type { AgentIntegration } from "@/features/agents/types";

export default function NewAgentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const integration = String(
      formData.get("integration") ?? "http",
    ) as AgentIntegration;

    try {
      setLoading(true);
      setError(null);

      const agent = await createAgent({
        name: String(formData.get("name") ?? ""),
        description: String(
          formData.get("description") ?? "",
        ),
        integration,
        endpoint:
          String(formData.get("endpoint") ?? "").trim() ||
          null,
        model:
          String(formData.get("model") ?? "").trim() ||
          null,
      });

      window.location.href = `/agents/${agent.id}`;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create agent",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/agents"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to agents
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Add Agent
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Connect an AI agent to start reliability testing.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Agent Details</h2>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium"
              >
                Agent name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. SupportBot"
                required
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="What does this agent do?"
                className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Integration</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Choose how your agent connects to the evaluation engine.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="cursor-pointer rounded-xl border p-5 hover:bg-zinc-50">
              <input
                type="radio"
                name="integration"
                value="http"
                defaultChecked
                className="mr-3"
              />

              <span className="font-medium">
                HTTP Endpoint
              </span>

              <p className="mt-2 pl-6 text-sm text-zinc-500">
                Connect an externally hosted agent through an API endpoint.
              </p>
            </label>

            <label className="cursor-pointer rounded-xl border p-5 hover:bg-zinc-50">
              <input
                type="radio"
                name="integration"
                value="openai"
                className="mr-3"
              />

              <span className="font-medium">
                OpenAI Adapter
              </span>

              <p className="mt-2 pl-6 text-sm text-zinc-500">
                Connect an agent via OpenAI chat completions interface.
              </p>
            </label>

            <label className="cursor-pointer rounded-xl border p-5 hover:bg-zinc-50">
              <input
                type="radio"
                name="integration"
                value="custom"
                className="mr-3"
              />

              <span className="font-medium">
                Custom Adapter
              </span>

              <p className="mt-2 pl-6 text-sm text-zinc-500">
                Connect an agent through the OOSC adapter interface.
              </p>
            </label>
          </div>

          <div className="mt-6">
            <label
              htmlFor="endpoint"
              className="mb-2 block text-sm font-medium"
            >
              Agent endpoint
            </label>

            <input
              id="endpoint"
              name="endpoint"
              type="url"
              placeholder="https://your-agent.example.com/run"
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
            />

            <p className="mt-2 text-xs text-zinc-400">
              The endpoint will receive evaluation tasks and return the
              agent response.
            </p>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Configuration</h2>

          <div className="mt-6">
            <label
              htmlFor="model"
              className="mb-2 block text-sm font-medium"
            >
              Model
            </label>

            <input
              id="model"
              name="model"
              type="text"
              placeholder="e.g. gpt-5"
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
            />
          </div>
        </section>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Link
            href="/agents"
            className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-zinc-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Add Agent"}
          </button>
        </div>
      </form>
    </div>
  );
}