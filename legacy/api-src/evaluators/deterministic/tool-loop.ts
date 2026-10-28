import type { ToolCall } from "../../tools";

export type ToolLoopResult = {
  detected: boolean;
  toolName: string | null;
  repetitions: number;
};

export function detectToolLoop(
  toolCalls: ToolCall[],
  threshold = 3,
): ToolLoopResult {
  if (toolCalls.length < threshold) {
    return {
      detected: false,
      toolName: null,
      repetitions: 0,
    };
  }

  const counts = new Map<string, number>();

  for (const call of toolCalls) {
    counts.set(
      call.name,
      (counts.get(call.name) ?? 0) + 1,
    );
  }

  for (const [toolName, repetitions] of counts) {
    if (repetitions >= threshold) {
      return {
        detected: true,
        toolName,
        repetitions,
      };
    }
  }

  return {
    detected: false,
    toolName: null,
    repetitions: 0,
  };
}