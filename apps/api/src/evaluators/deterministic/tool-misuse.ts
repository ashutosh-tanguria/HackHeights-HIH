import type { ToolCall } from "../../tools";
import type { ToolRegistry } from "../../tools";

export type ToolMisuseResult = {
  detected: boolean;
  toolName: string | null;
  reason: string | null;
};

export function detectToolMisuse(
  toolCalls: ToolCall[],
  toolRegistry: ToolRegistry,
): ToolMisuseResult {
  for (const call of toolCalls) {
    if (!toolRegistry.has(call.name)) {
      return {
        detected: true,
        toolName: call.name,
        reason: `Tool "${call.name}" is not registered.`,
      };
    }
  }

  return {
    detected: false,
    toolName: null,
    reason: null,
  };
}