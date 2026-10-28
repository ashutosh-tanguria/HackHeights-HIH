import type { Scenario } from "../../models";
import type { ExecutionResult } from "../execution";
import type {
  ExecutionContext,
} from "../execution/execution-context";

export type TraceEventType =
  | "agent"
  | "tool_call"
  | "tool_result"
  | "evaluation";

export type TraceEvent = {
  id: string;
  type: TraceEventType;
  name: string;
  timestamp: string;
  input?: unknown;
  output?: unknown;
  durationMs?: number;
};

export type ExecutionTrace = {
  id: string;
  scenarioId: string;
  events: TraceEvent[];
  startedAt: string;
  completedAt: string;
};

export type TraceEvaluation = {
  passed: boolean;
  score: number;
  failures: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    evidence: string[];
  }>;
};

export class TraceService {
  createTrace(
    scenario: Scenario,
    execution: ExecutionResult,
    context: ExecutionContext,
    evaluation?: TraceEvaluation,
  ): ExecutionTrace {
    const completedAt =
      new Date().toISOString();

    const startedAt = new Date(
      Date.now() - execution.durationMs,
    ).toISOString();

    const events: TraceEvent[] = [];

    const agentCompletedAt =
      new Date(
        Date.now(),
      ).toISOString();

    events.push({
      id: crypto.randomUUID(),
      type: "agent",
      name: "Agent Execution",
      timestamp: agentCompletedAt,
      input: {
        scenarioId: scenario.id,
        userInput: scenario.userInput,
      },
      output: execution.output,
      durationMs: execution.durationMs,
    });

    if (context.events && context.events.length > 0) {
      for (const event of context.events) {
        events.push({
          id: event.toolCallId || crypto.randomUUID(),
          type: event.type,
          name: event.toolName,
          timestamp: event.timestamp,
          input: event.input,
          output: event.output,
          durationMs: event.durationMs,
        });
      }
    } else {
      let elapsedMs = 0;

      for (const toolCall of context.toolCalls) {
        const toolStartedAt =
          new Date(
            Date.now() -
              execution.durationMs +
              elapsedMs,
          ).toISOString();

        const toolCompletedAt =
          new Date(
            Date.now() -
              execution.durationMs +
              elapsedMs +
              toolCall.durationMs,
          ).toISOString();

        events.push({
          id: crypto.randomUUID(),
          type: "tool_call",
          name: toolCall.name,
          timestamp: toolStartedAt,
          input: toolCall.input,
        });

        events.push({
          id: crypto.randomUUID(),
          type: "tool_result",
          name: toolCall.name,
          timestamp: toolCompletedAt,
          output: toolCall.output,
          durationMs: toolCall.durationMs,
        });

        elapsedMs += toolCall.durationMs;
      }
    }

    if (evaluation) {
      events.push({
        id: crypto.randomUUID(),
        type: "evaluation",
        name: "Evaluation",
        timestamp: completedAt,
        output: evaluation,
      });
    }

    events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime(),
    );

    return {
      id: crypto.randomUUID(),
      scenarioId: scenario.id,
      events,
      startedAt,
      completedAt,
    };
  }
}