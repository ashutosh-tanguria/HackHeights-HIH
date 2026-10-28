import type { ToolCall } from "../../tools";

export type DestructiveActionResult = {
  detected: boolean;
  toolName: string | null;
  reason: string | null;
};

const destructiveToolNames = new Set([
  "delete",
  "remove",
  "destroy",
  "drop",
  "purge",
  "reset",
  "terminate",
  "shutdown",
  "disable",
]);

export function detectDestructiveAction(
  toolCalls: ToolCall[],
): DestructiveActionResult {
  for (const call of toolCalls) {
    const normalizedName =
      call.name.trim().toLowerCase();

    if (
      destructiveToolNames.has(
        normalizedName,
      )
    ) {
      return {
        detected: true,
        toolName: call.name,
        reason:
          `Destructive tool "${call.name}" was executed.`,
      };
    }
  }

  return {
    detected: false,
    toolName: null,
    reason: null,
  };
}