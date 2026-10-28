import { ToolRegistry } from "./tool-registry";
import type { MockTool } from "./types";

export const mockTools: MockTool[] = [
  {
    name: "search",
    description: "Mock search tool",
    handler: async (input) => ({
      query: input.query ?? "",
      results: [
        {
          title: "Mock result",
          snippet: "This is a mocked search result.",
        },
      ],
    }),
  },
  {
    name: "calculator",
    description: "Mock calculator tool",
    handler: async (input) => {
      const a = Number(input.a ?? 0);
      const b = Number(input.b ?? 0);
      const op = String(
        input.operation ?? input.operator ?? "+",
      ).toLowerCase();

      let result = a + b;
      if (op === "-" || op === "subtract") {
        result = a - b;
      } else if (op === "*" || op === "multiply") {
        result = a * b;
      } else if (op === "/" || op === "divide") {
        result = b !== 0 ? a / b : 0;
      }

      return {
        result,
      };
    },
  },
];

export function createMockToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  for (const tool of mockTools) {
    registry.register(tool);
  }

  return registry;
}