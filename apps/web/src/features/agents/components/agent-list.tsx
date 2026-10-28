import { AgentCard } from "./agent-card";
import type { Agent } from "../types";

type AgentListProps = {
  agents: Agent[];
};

export function AgentList({ agents }: AgentListProps) {
  if (agents.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border bg-white">
        <p className="text-sm text-zinc-400">
          No agents found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}