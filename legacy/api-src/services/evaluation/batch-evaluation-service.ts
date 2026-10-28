import type {
  AgentRepository,
  ScenarioRepository,
  TestRunRepository,
  TestResultRepository,
  FailureRepository,
} from "../../repositories";
import type { ExecutionPipeline } from "../execution/execution-pipeline";
import type { DiagnosisService } from "../diagnosis/diagnosis-service";
import type {
  BatchRunCategoryScore,
  BatchTestRunResult,
} from "../../models/batch-run";
import type { TestRun } from "../../models/test-run";
import type { TestResult } from "../../models/test-result";
import type { Failure } from "../../models/failure";
import type { FailureDiagnosis } from "../../models/diagnosis";

export class BatchEvaluationService {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly scenarioRepository: ScenarioRepository,
    private readonly testRunRepository: TestRunRepository,
    private readonly testResultRepository: TestResultRepository,
    private readonly failureRepository: FailureRepository,
    private readonly executionPipeline: ExecutionPipeline,
    private readonly diagnosisService?: DiagnosisService,
  ) {}

  async runBatch(
    agentId: string,
    scenarioIds: string[],
  ): Promise<BatchTestRunResult> {
    const agent = this.agentRepository.findById(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const batchId = crypto.randomUUID();
    const startTime = Date.now();

    const results: TestResult[] = [];
    const failures: Failure[] = [];
    const diagnoses: FailureDiagnosis[] = [];

    const scenarios = scenarioIds
      .map((id) => this.scenarioRepository.findById(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    if (scenarios.length === 0) {
      throw new Error("No valid scenarios found to execute in batch");
    }

    let passedCount = 0;
    let failedCount = 0;

    const categoryBuckets: {
      safety: { total: number; passed: number; failed: number };
      correctness: { total: number; passed: number; failed: number };
      toolUsage: { total: number; passed: number; failed: number };
      robustness: { total: number; passed: number; failed: number };
    } = {
      safety: { total: 0, passed: 0, failed: 0 },
      correctness: { total: 0, passed: 0, failed: 0 },
      toolUsage: { total: 0, passed: 0, failed: 0 },
      robustness: { total: 0, passed: 0, failed: 0 },
    };

    for (const scenario of scenarios) {
      const runId = crypto.randomUUID();
      const now = new Date().toISOString();

      const testRun: TestRun = {
        id: runId,
        agentId: agent.id,
        suiteId: scenario.id,
        status: "running",
        reliabilityScore: null,
        totalTests: 1,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        durationMs: null,
        traceId: null,
        startedAt: now,
        completedAt: null,
        createdAt: now,
      };

      this.testRunRepository.create(testRun);

      try {
        const pipelineResult = await this.executionPipeline.run(
          agent,
          scenario,
          testRun,
        );

        this.testRunRepository.update(testRun.id, pipelineResult.execution.testRun);

        const isPassed = pipelineResult.evaluation.evaluation.passed;
        if (isPassed) {
          passedCount++;
        } else {
          failedCount++;
        }

        // Categorize into dimension buckets
        if (
          scenario.category === "destructive_action" ||
          scenario.category === "prompt_injection"
        ) {
          categoryBuckets.safety.total++;
          if (isPassed) categoryBuckets.safety.passed++;
          else categoryBuckets.safety.failed++;
        } else if (scenario.category === "basic_reliability") {
          categoryBuckets.correctness.total++;
          if (isPassed) categoryBuckets.correctness.passed++;
          else categoryBuckets.correctness.failed++;
        } else if (scenario.category === "tool_safety") {
          categoryBuckets.toolUsage.total++;
          if (isPassed) categoryBuckets.toolUsage.passed++;
          else categoryBuckets.toolUsage.failed++;
        } else {
          categoryBuckets.robustness.total++;
          if (isPassed) categoryBuckets.robustness.passed++;
          else categoryBuckets.robustness.failed++;
        }

        // Handle failures & results
        let primaryFailureId: string | null = null;
        if (pipelineResult.evaluation.failures.length > 0) {
          for (const f of pipelineResult.evaluation.failures) {
            const savedFailure = this.failureRepository.create(f);
            failures.push(savedFailure);
            if (!primaryFailureId) primaryFailureId = savedFailure.id;

            if (this.diagnosisService) {
              try {
                const diag = await this.diagnosisService.diagnoseFailure(
                  savedFailure.id,
                );
                diagnoses.push(diag);
              } catch {
                // Ignore diagnosis failure in batch
              }
            }
          }
        }

        const testResult: TestResult = {
          id: crypto.randomUUID(),
          runId: testRun.id,
          scenarioId: scenario.id,
          status: isPassed ? "passed" : "failed",
          score: pipelineResult.evaluation.evaluation.score,
          expectedBehavior: scenario.expectedBehavior,
          actualBehavior: isPassed
            ? scenario.expectedBehavior
            : pipelineResult.evaluation.failures.map((f) => f.description),
          failureId: primaryFailureId,
          durationMs: testRun.durationMs ?? 0,
          createdAt: new Date().toISOString(),
        };

        const savedResult = this.testResultRepository.create(testResult);
        results.push(savedResult);
      } catch (err) {
        failedCount++;
        testRun.status = "failed";
        testRun.failedTests = 1;
        testRun.reliabilityScore = 0;
        testRun.completedAt = new Date().toISOString();
        this.testRunRepository.update(testRun.id, testRun);
      }
    }

    // Update agent totals
    const totalRuns = this.testRunRepository
      .findAll()
      .filter((r) => r.agentId === agent.id);
    const agentTotalTests = totalRuns.reduce((sum, r) => sum + r.totalTests, 0);
    const agentPassedTests = totalRuns.reduce((sum, r) => sum + r.passedTests, 0);
    const agentFailedTests = totalRuns.reduce((sum, r) => sum + r.failedTests, 0);
    const agentReliability =
      agentTotalTests > 0 ? (agentPassedTests / agentTotalTests) * 100 : 0;

    this.agentRepository.update(agent.id, {
      totalTests: agentTotalTests,
      passedTests: agentPassedTests,
      failedTests: agentFailedTests,
      reliabilityScore: agentReliability,
    });

    const totalScenarios = scenarios.length;
    const reliabilityScore =
      totalScenarios > 0 ? Math.round((passedCount / totalScenarios) * 100) : 0;

    const calcCategoryScore = (
      name: string,
      b: { total: number; passed: number; failed: number },
    ): BatchRunCategoryScore => ({
      category: name,
      total: b.total,
      passed: b.passed,
      failed: b.failed,
      score: b.total > 0 ? Math.round((b.passed / b.total) * 100) : 100,
    });

    return {
      batchId,
      agentId: agent.id,
      totalScenarios,
      passedScenarios: passedCount,
      failedScenarios: failedCount,
      reliabilityScore,
      totalDurationMs: Date.now() - startTime,
      categoryScores: {
        safety: calcCategoryScore("Safety", categoryBuckets.safety),
        correctness: calcCategoryScore("Correctness", categoryBuckets.correctness),
        toolUsage: calcCategoryScore("Tool Usage", categoryBuckets.toolUsage),
        robustness: calcCategoryScore("Robustness", categoryBuckets.robustness),
      },
      results,
      failures,
      diagnoses,
      createdAt: new Date().toISOString(),
    };
  }
}
