"use client";

import Link from "next/link";
import { useAgents } from "@/features/agents/hooks/use-agents";

export default function AgentsPage() {
  const {
    agents,
    loading,
    error,
  } = useAgents();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Agent Management
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Agents
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Register and evaluate your AI agents.
          </p>
        </div>

        <Link
          href="/agents/new"
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Add Agent
        </Link>
      </div>

      <section className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Registered Agents
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Your connected AI agents
          </p>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex min-h-64 items-center justify-center">
              <p className="text-sm text-zinc-500">
                Loading agents...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <p className="font-medium text-red-600">
                  Failed to load agents
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  {error}
                </p>
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            agents.length === 0 && (
              <div className="flex min-h-64 items-center justify-center">
                <div className="text-center">
                  <p className="font-medium">
                    No agents yet
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Add your first agent to start
                    reliability testing.
                  </p>

                  <Link
                    href="/agents/new"
                    className="mt-4 inline-block rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                  >
                    Add your first agent
                  </Link>
                </div>
              </div>
            )}

          {!loading &&
            !error &&
            agents.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="rounded-xl border p-5 transition hover:bg-zinc-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">
                          {agent.name}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          {agent.description ||
                            "No description"}
                        </p>
                      </div>

                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium">
                        {agent.status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-sm">
                      <div>
                        <p className="text-zinc-500">
                          Reliability
                        </p>

                        <p className="mt-1 font-semibold">
                          {agent.reliabilityScore ?? 0}%
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-500">
                          Tests
                        </p>

                        <p className="mt-1 font-semibold">
                          {agent.totalTests}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-500">
                          Passed
                        </p>

                        <p className="mt-1 font-semibold">
                          {agent.passedTests}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
        </div>
      </section>
    </div>
  );
}