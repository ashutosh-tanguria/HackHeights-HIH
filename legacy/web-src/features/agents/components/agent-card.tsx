import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAgentReliabilityLabel,
  getAgentStatusLabel,
  getAgentTestSummary,
} from "../utils";
import type { Agent } from "../types";

type AgentCardProps = {
  agent: Agent;
};

export function AgentCard({ agent }: AgentCardProps) {
  const statusVariant =
    agent.status === "active"
      ? "success"
      : agent.status === "error"
        ? "danger"
        : "default";

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="truncate font-semibold">{agent.name}</h3>

            <Badge variant={statusVariant}>
              {getAgentStatusLabel(agent.status)}
            </Badge>
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
            {agent.description || "No description provided."}
          </p>

          <div className="mt-4 flex gap-5 text-xs text-zinc-500">
            <span>{agent.integration.toUpperCase()}</span>
            <span>{getAgentTestSummary(agent)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-zinc-500">Reliability</p>

            <p className="mt-1 text-xl font-semibold">
              {getAgentReliabilityLabel(agent.reliabilityScore)}
            </p>
          </div>

          <Link
            href={`/agents/${agent.id}`}
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            View
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}