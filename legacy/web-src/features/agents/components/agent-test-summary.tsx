import { Card, CardContent } from "@/components/ui/card";
import type { Agent } from "../types";

type AgentTestSummaryProps = {
  agent: Agent;
};

export function AgentTestSummary({
  agent,
}: AgentTestSummaryProps) {
  const passRate =
    agent.totalTests > 0
      ? Math.round(
          (agent.passedTests / agent.totalTests) * 100,
        )
      : 0;

  const failureRate =
    agent.totalTests > 0
      ? Math.round(
          (agent.failedTests / agent.totalTests) * 100,
        )
      : 0;

  return (
    <Card>
      <CardContent>
        <div>
          <h2 className="font-semibold">Test Summary</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Current evaluation statistics for this agent.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="text-xs font-medium text-zinc-500">
              Total Tests
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {agent.totalTests}
            </p>
          </div>

          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="text-xs font-medium text-zinc-500">
              Pass Rate
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {passRate}%
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              {agent.passedTests} passed
            </p>
          </div>

          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="text-xs font-medium text-zinc-500">
              Failure Rate
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {failureRate}%
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              {agent.failedTests} failed
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}