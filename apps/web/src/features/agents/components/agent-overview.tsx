import { AgentConnection } from "./agent-connection";
import { AgentReliability } from "./agent-reliability";
import { AgentTestSummary } from "./agent-test-summary";
import type { Agent } from "../types";

type AgentOverviewProps = {
  agent: Agent;
};

export function AgentOverview({
  agent,
}: AgentOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <AgentReliability agent={agent} />
        <AgentConnection agent={agent} />
      </div>

      <AgentTestSummary agent={agent} />
    </div>
  );
}