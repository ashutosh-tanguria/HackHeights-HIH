import type { ToolCall } from "./types";

export type ToolExecutionStep = {
  tool: string;
  input: Record<string, unknown>;
};

export type ExecutionPlan = {
  steps: ToolExecutionStep[];
  toolCalls: ToolCall[];
};

export function createExecutionPlan(
  steps: ToolExecutionStep[] = [],
): ExecutionPlan {
  return {
    steps,
    toolCalls: [],
  };
}