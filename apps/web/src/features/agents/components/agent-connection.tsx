import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Agent } from "../types";

type AgentConnectionProps = {
  agent: Agent;
};

export function AgentConnection({
  agent,
}: AgentConnectionProps) {
  return (
    <Card>
      <CardContent>
        <div>
          <h2 className="font-semibold">Connection</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Configuration used to communicate with this agent.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-xs font-medium text-zinc-400">
                Integration
              </p>

              <p className="mt-1 text-sm font-medium">
                {agent.integration.toUpperCase()}
              </p>
            </div>

            <Badge
              variant={
                agent.status === "active"
                  ? "success"
                  : agent.status === "error"
                    ? "danger"
                    : "default"
              }
            >
              {agent.status.replaceAll("_", " ")}
            </Badge>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-400">
              Endpoint
            </p>

            <p className="mt-1 break-all rounded-lg bg-zinc-50 p-3 font-mono text-xs text-zinc-600">
              {agent.endpoint ?? "Not configured"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-400">
              Model
            </p>

            <p className="mt-1 text-sm">
              {agent.model ?? "Not configured"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}