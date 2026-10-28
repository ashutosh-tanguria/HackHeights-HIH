import type {
  Agent,
  Scenario,
  TestRun,
} from "../../models";
import {
  ExecutionService,
  type ExecutionResult,
} from "./execution-service";
import type { ExecutionContext } from "./execution-context";

export type ExecutionRunResult = {
  testRun: TestRun;
  execution: ExecutionResult;
};

export class ExecutionRunner {
  constructor(
    private readonly executionService: ExecutionService,
  ) {}

  async run(
    agent: Agent,
    scenario: Scenario,
    testRun: TestRun,
    context: ExecutionContext,
  ): Promise<ExecutionRunResult> {
    const startedAt = Date.now();

    testRun.status = "running";
    testRun.startedAt = new Date().toISOString();

    const execution =
      await this.executionService.execute(
        agent,
        scenario,
        testRun,
        context,
      );

    testRun.status = execution.success
      ? "completed"
      : "failed";

    testRun.totalTests = 1;
    testRun.passedTests = execution.success ? 1 : 0;
    testRun.failedTests = execution.success ? 0 : 1;
    testRun.skippedTests = 0;
    testRun.durationMs = Date.now() - startedAt;
    testRun.completedAt = new Date().toISOString();

    return {
      testRun,
      execution,
    };
  }
}