"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  deleteAgent,
  getAgent,
  updateAgent,
} from "@/features/agents/api";
import type {
  Agent,
  AgentIntegration,
  AgentStatus,
} from "@/features/agents/types";

export default function AgentSettingsPage() {
  const params = useParams<{ agentId: string }>();
  const router = useRouter();
  const agentId = params.agentId;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [integration, setIntegration] =
    useState<AgentIntegration>("http");
  const [endpoint, setEndpoint] = useState("");
  const [model, setModel] = useState("");
  const [status, setStatus] = useState<AgentStatus>("active");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadAgent() {
      if (!agentId) return;

      try {
        setLoading(true);
        setError(null);

        const data = await getAgent(agentId);
        setAgent(data);
        setName(data.name);
        setDescription(data.description || "");
        setIntegration(data.integration);
        setEndpoint(data.endpoint || "");
        setModel(data.model || "");
        setStatus(data.status);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load agent settings",
        );
      } finally {
        setLoading(false);
      }
    }

    loadAgent();
  }, [agentId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!agentId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updated = await updateAgent(agentId, {
        name,
        description,
        integration,
        endpoint: endpoint || null,
        model: model || null,
        status,
      });

      setAgent(updated);
      setSuccess("Agent settings saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save agent settings",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!agentId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete agent "${name}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);

      await deleteAgent(agentId);
      router.push("/agents");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete agent",
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href={`/agents/${agentId}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to agent
        </Link>
        <p className="text-sm text-zinc-500">Loading agent settings...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/agents"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to agents
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error || "Agent not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href={`/agents/${agentId}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to agent
        </Link>

        <div className="mt-4">
          <p className="text-sm font-medium text-zinc-500">
            Configuration
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Agent Settings
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Configure agent connection, metadata, and lifecycle status.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">General Information</h2>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium"
              >
                Agent Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium"
              >
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AgentStatus)
                }
                className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
                <option value="not_configured">Not Configured</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Integration & Connection</h2>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Integration Type
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                {(["http", "openai", "custom"] as const).map((type) => (
                  <label
                    key={type}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 text-sm font-medium capitalize ${
                      integration === type
                        ? "border-zinc-950 bg-zinc-50"
                        : "border-zinc-200"
                    }`}
                  >
                    <span>{type}</span>
                    <input
                      type="radio"
                      name="integration"
                      value={type}
                      checked={integration === type}
                      onChange={() => setIntegration(type)}
                      className="h-4 w-4"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="endpoint"
                className="mb-2 block text-sm font-medium"
              >
                Endpoint URL
              </label>

              <input
                id="endpoint"
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://your-agent.example.com/api"
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="model"
                className="mb-2 block text-sm font-medium"
              >
                Model Identifier
              </label>

              <input
                id="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o, claude-3-5-sonnet, custom-model"
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold">Danger Zone</h2>

        <p className="mt-1 text-sm text-zinc-500">
          Destructive actions for this agent.
        </p>

        <div className="mt-6 flex items-center justify-between rounded-lg border border-red-200 p-4">
          <div>
            <p className="text-sm font-medium text-red-700">
              Delete agent
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Permanently remove this agent configuration.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </section>
    </div>
  );
}