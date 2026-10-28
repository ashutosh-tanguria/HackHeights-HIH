import { Card, CardContent } from "@/components/ui/card";

export type TraceEvent = {
  id: string;
  type: "agent" | "tool_call" | "tool_result" | "evaluation";
  name: string;
  timestamp: string;
  input?: unknown;
  output?: unknown;
  durationMs?: number;
};

type TraceViewerProps = {
  events: TraceEvent[];
};

const eventLabels = {
  agent: "Agent",
  tool_call: "Tool Call",
  tool_result: "Tool Result",
  evaluation: "Evaluation",
} as const;

export function TraceViewer({ events }: TraceViewerProps) {
  return (
    <Card>
      <CardContent>
        <div>
          <h2 className="font-semibold">Execution Trace</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Step-by-step evidence from the agent execution.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center">
            <p className="text-sm text-zinc-400">
              No trace events available.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="relative flex gap-4"
              >
                {index < events.length - 1 && (
                  <div className="absolute left-4 top-9 h-full w-px bg-zinc-200" />
                )}

                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1 rounded-xl border bg-zinc-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-medium text-zinc-400">
                        {eventLabels[event.type]}
                      </span>

                      <h3 className="mt-1 text-sm font-semibold">
                        {event.name}
                      </h3>
                    </div>

                    <div className="text-right text-xs text-zinc-400">
                      <p>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>

                      {event.durationMs !== undefined && (
                        <p className="mt-1">
                          {event.durationMs}ms
                        </p>
                      )}
                    </div>
                  </div>

                  {(event.input !== undefined ||
                    event.output !== undefined) && (
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {event.input !== undefined && (
                        <div>
                          <p className="mb-2 text-xs font-medium text-zinc-400">
                            Input
                          </p>

                          <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs">
                            {JSON.stringify(event.input, null, 2)}
                          </pre>
                        </div>
                      )}

                      {event.output !== undefined && (
                        <div>
                          <p className="mb-2 text-xs font-medium text-zinc-400">
                            Output
                          </p>

                          <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs">
                            {JSON.stringify(event.output, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}