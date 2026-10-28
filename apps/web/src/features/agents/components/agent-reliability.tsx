import { Card, CardContent } from "@/components/ui/card";
import { formatPercentage } from "@/lib/utils";
import type { Agent } from "../types";

type AgentReliabilityProps = {
  agent: Agent;
};

export function AgentReliability({
  agent,
}: AgentReliabilityProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Reliability Score
            </p>

            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {formatPercentage(agent.reliabilityScore)}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Current agent reliability
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4">
            <span className="text-sm font-semibold">
              {agent.reliabilityScore === null
                ? "--"
                : Math.round(agent.reliabilityScore)}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">Tests</p>

            <p className="mt-1 font-semibold">
              {agent.totalTests}
            </p>
          </div>

          <div className="rounded-lg bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">Passed</p>

            <p className="mt-1 font-semibold">
              {agent.passedTests}
            </p>
          </div>

          <div className="rounded-lg bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">Failed</p>

            <p className="mt-1 font-semibold">
              {agent.failedTests}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}