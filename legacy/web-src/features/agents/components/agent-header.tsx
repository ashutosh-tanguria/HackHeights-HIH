import Link from "next/link";
import { AgentStatusBadge } from "./agent-status-badge";
import type { Agent } from "../types";

type AgentHeaderProps = {
  agent: Agent;
};

export function AgentHeader({ agent }: AgentHeaderProps) {
  return (
    <div className="space-y-5">
      <Link
        href="/agents"
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Back to agents
      </Link>

      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {agent.name}
            </h1>

            <AgentStatusBadge status={agent.status} />
          </div>

          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            {agent.description || "No description provided."}
          </p>

          <div className="mt-4 flex items-center gap-5 text-xs text-zinc-400">
            <span>
              Integration:{" "}
              <strong className="font-medium text-zinc-700">
                {agent.integration.toUpperCase()}
              </strong>
            </span>

            <span>
              Model:{" "}
              <strong className="font-medium text-zinc-700">
                {agent.model ?? "Not configured"}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}