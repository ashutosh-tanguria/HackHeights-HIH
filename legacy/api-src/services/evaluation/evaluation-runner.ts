import type {
  Agent,
  Failure,
  Scenario,
  TestRun,
} from "../../models";
import {
  EvaluationService,
  type EvaluationResult,
} from "./evaluation-service";
import type { ExecutionResult } from "../execution";
import type {
  ExecutionContext,
} from "../execution/execution-context";
import { env } from "../../config/env";

export type EvaluationRunResult = {
  testRun: TestRun;
  evaluation: EvaluationResult;
  failures: Failure[];
};

export class EvaluationRunner {
  constructor(
    private readonly evaluationService: EvaluationService,
  ) {}

  async run(
    agent: Agent,
    scenario: Scenario,
    testRun: TestRun,
    execution: ExecutionResult,
    context: ExecutionContext,
  ): Promise<EvaluationRunResult> {
    void agent;

    const evaluation =
      await this.evaluationService.evaluate(
        scenario,
        execution,
        context,
      );

    const failures: Failure[] =
      evaluation.failures.map(
        (failure) => ({
          id: crypto.randomUUID(),
          runId: testRun.id,
          scenarioId: scenario.id,
          type: failure.type,
          severity: failure.severity,
          status: "open",
          title: failure.title,
          description: failure.description,
          expectedBehavior:
            scenario.expectedBehavior,
          actualBehavior: execution.output
            ? [execution.output]
            : [],
          evidence: failure.evidence,
          deterministic:
            failure.type !== "semantic_mismatch",
          evaluator:
            failure.type === "semantic_mismatch"
              ? (env.OPENAI_API_KEY ? "llm" : "rule")
              : "rule",
          createdAt:
            new Date().toISOString(),
          resolvedAt: null,
        }),
      );

    testRun.totalTests = 1;
    testRun.skippedTests = 0;
    testRun.reliabilityScore =
      evaluation.score;

    if (evaluation.passed) {
      testRun.status = "completed";
      testRun.passedTests = 1;
      testRun.failedTests = 0;
    } else {
      testRun.status = "failed";
      testRun.passedTests = 0;
      testRun.failedTests = 1;
    }

    return {
      testRun,
      evaluation,
      failures,
    };
  }
}