import type {
  MockTool,
  ToolCall,
} from "./types";

export class ToolRegistry {
  private readonly tools = new Map<
    string,
    MockTool
  >();

  register(tool: MockTool): void {
    this.tools.set(tool.name, tool);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  get(name: string): MockTool | undefined {
    return this.tools.get(name);
  }

  list(): MockTool[] {
    return Array.from(this.tools.values());
  }

  async execute(
    name: string,
    input: Record<string, unknown>,
  ): Promise<ToolCall> {
    const startedAt = Date.now();
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(
        `Tool "${name}" is not registered`,
      );
    }

    const output = await tool.handler(input);

    return {
      id: crypto.randomUUID(),
      name,
      input,
      output,
      durationMs: Date.now() - startedAt,
    };
  }
}