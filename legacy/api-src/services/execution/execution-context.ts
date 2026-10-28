import type { ToolCall } from "../../tools";
import {
  createMockToolRegistry,
} from "../../tools/mock-tools";
import type { ToolRegistry } from "../../tools";
import type {
  ExecutionPlan,
} from "../../tools/execution-plan";

export type ExecutionEvent = {
  type:
    | "tool_call"
    | "tool_result";
  toolCallId: string;
  toolName: string;
  timestamp: string;
  input?: Record<string, unknown>;
  output?: unknown;
  durationMs?: number;
};

export type ExecutionContext = {
  toolRegistry: ToolRegistry;
  toolCalls: ToolCall[];
  executionPlan: ExecutionPlan;
  events: ExecutionEvent[];
};

export function createExecutionContext(
  executionPlan: ExecutionPlan = {
    steps: [],
    toolCalls: [],
  },
): ExecutionContext {
  return {
    toolRegistry: createMockToolRegistry(),
    toolCalls: [],
    executionPlan,
    events: [],
  };
}

export async function executeTool(
  context: ExecutionContext,
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  const startedAt =
    new Date().toISOString();

  try {
    const toolCall =
      await context.toolRegistry.execute(
        name,
        input,
      );

    context.events.push({
      type: "tool_call",
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      timestamp: startedAt,
      input: toolCall.input,
    });

    context.events.push({
      type: "tool_result",
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      timestamp:
        new Date().toISOString(),
      output: toolCall.output,
      durationMs: toolCall.durationMs,
    });

    context.toolCalls.push(toolCall);
    context.executionPlan.toolCalls.push(
      toolCall,
    );

    return toolCall.output;
  } catch (error) {
    const toolCall: ToolCall = {
      id: crypto.randomUUID(),
      name,
      input,
      output: {
        error:
          error instanceof Error
            ? error.message
            : "Tool execution failed",
      },
      durationMs: 0,
    };

    context.events.push({
      type: "tool_call",
      toolCallId: toolCall.id,
      toolName: name,
      timestamp: startedAt,
      input,
    });

    context.events.push({
      type: "tool_result",
      toolCallId: toolCall.id,
      toolName: name,
      timestamp:
        new Date().toISOString(),
      output: toolCall.output,
      durationMs: 0,
    });

    context.toolCalls.push(toolCall);
    context.executionPlan.toolCalls.push(
      toolCall,
    );

    throw error;
  }
}