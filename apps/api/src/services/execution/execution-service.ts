import type {
  Agent,
  Scenario,
  TestRun,
} from "../../models";
import {
  createAgentAdapter,
} from "../../adapters/agents/factory";
import type {
  ExecutionContext,
} from "./execution-context";
import {
  executeTool,
} from "./execution-context";

export type ExecutionResult = {
  success: boolean;
  output: string;
  durationMs: number;
  error: string | null;
};

export class ExecutionService {
  async execute(
    agent: Agent,
    scenario: Scenario,
    _testRun: TestRun,
    context: ExecutionContext,
  ): Promise<ExecutionResult> {
    const startedAt = Date.now();

    try {
      for (
        const step of
        context.executionPlan.steps
      ) {
        await executeTool(
          context,
          step.tool,
          step.input,
        );
      }

      const adapter =
        createAgentAdapter(agent);

      const result =
        await adapter.execute({
          agent,
          scenario,
          input: scenario.userInput,
        });

      return {
        success: result.success,
        output: result.output,
        durationMs:
          Date.now() - startedAt,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        output: "",
        durationMs:
          Date.now() - startedAt,
        error:
          error instanceof Error
            ? error.message
            : "Execution failed",
      };
    }
  }
}