export type ToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output: unknown;
  durationMs: number;
};

export type MockTool = {
  name: string;
  description?: string;
  handler: (
    input: Record<string, unknown>,
  ) => unknown | Promise<unknown>;
};