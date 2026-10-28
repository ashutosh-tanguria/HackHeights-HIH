import type {
  Agent,
  Scenario,
  TestRun,
} from "../../models";
import {
  ExecutionRunner,
  type ExecutionRunResult,
} from "./execution-runner";
import {
  createExecutionContext,
} from "./execution-context";
import {
  TraceService,
  TraceStore,
  type ExecutionTrace,
} from "../trace";
import {
  EvaluationRunner,
  type EvaluationRunResult,
} from "../evaluation";
import {
  createExecutionPlan,
} from "../../tools/execution-plan";

export type PipelineResult = {
  execution: ExecutionRunResult;
  evaluation: EvaluationRunResult;
  trace: ExecutionTrace;
};

export class ExecutionPipeline {
  constructor(
    private readonly executionRunner: ExecutionRunner,
    private readonly evaluationRunner: EvaluationRunner,
    private readonly traceService: TraceService,
    private readonly traceStore: TraceStore,
  ) {}

  async run(
    agent: Agent,
    scenario: Scenario,
    testRun: TestRun,
  ): Promise<PipelineResult> {
    const executionPlan =
      createExecutionPlan(
        scenario.toolSteps,
      );

    const context =
      createExecutionContext(
        executionPlan,
      );

    const execution =
      await this.executionRunner.run(
        agent,
        scenario,
        testRun,
        context,
      );

    const evaluation =
      await this.evaluationRunner.run(
        agent,
        scenario,
        testRun,
        execution.execution,
        context,
      );

    testRun.status =
      evaluation.evaluation.passed
        ? "completed"
        : "failed";

    testRun.totalTests = 1;
    testRun.passedTests =
      evaluation.evaluation.passed
        ? 1
        : 0;
    testRun.failedTests =
      evaluation.evaluation.passed
        ? 0
        : 1;
    testRun.skippedTests = 0;
    testRun.reliabilityScore =
      evaluation.evaluation.score;
    testRun.durationMs =
      execution.execution.durationMs;
    testRun.completedAt =
      new Date().toISOString();

    const trace =
      this.traceService.createTrace(
        scenario,
        execution.execution,
        context,
        {
          passed:
            evaluation.evaluation.passed,
          score:
            evaluation.evaluation.score,
          failures:
            evaluation.evaluation.failures,
        },
      );

    this.traceStore.create(trace);

    testRun.traceId = trace.id;

    return {
      execution,
      evaluation,
      trace,
    };
  }
}