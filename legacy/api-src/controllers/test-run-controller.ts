import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  agentRepository,
  scenarioRepository,
  testRunRepository,
  failureRepository,
  testResultRepository,
  executionPipeline,
  batchEvaluationService,
} from "../container";
import {
  TestRunService,
} from "../services";
import {
  createTestRunSchema,
  createBatchRunSchema,
} from "../schemas";

const testRunService =
  new TestRunService(
    testRunRepository,
  );

export async function testRunController(
  app: FastifyInstance,

) {
  app.get(
    "/test-runs",
    async () => {
      return testRunService.findAll();
    },
  );

  app.get<{
    Params: {
      runId: string;
    };
  }>(
    "/test-runs/:runId",
    async (
      request: FastifyRequest<{
        Params: {
          runId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const testRun =
        testRunService.findById(
          request.params.runId,
        );

      if (!testRun) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "TEST_RUN_NOT_FOUND",
            message: "Test run not found",
          },
        });
      }

      return testRun;
    },
  );

  app.get<{
    Params: {
      runId: string;
    };
  }>(
    "/test-runs/:runId/results",
    async (
      request: FastifyRequest<{
        Params: {
          runId: string;
        };
      }>,
    ) => {
      return testResultRepository.findByRunId(
        request.params.runId,
      );
    },
  );

  app.get<{
    Params: {
      runId: string;
    };
  }>(
    "/test-runs/:runId/failures",
    async (
      request: FastifyRequest<{
        Params: {
          runId: string;
        };
      }>,
    ) => {
      return failureRepository.findByRunId(
        request.params.runId,
      );
    },
  );

  app.post<{
    Body: unknown;
  }>(
    "/test-runs",
    async (
      request: FastifyRequest<{
        Body: unknown;
      }>,
      reply: FastifyReply,
    ) => {
      const input =
        createTestRunSchema.parse(
          request.body,
        );

      const agent =
        agentRepository.findById(
          input.agentId,
        );

      if (!agent) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "AGENT_NOT_FOUND",
            message: "Agent not found",
          },
        });
      }

      const scenario =
        scenarioRepository.findById(
          input.suiteId,
        );

      if (!scenario) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "SCENARIO_NOT_FOUND",
            message: "Scenario not found",
          },
        });
      }

      const testRun =
        testRunService.create(
          input.agentId,
          input.suiteId,
        );

      try {
        const result =
          await executionPipeline.run(
            agent,
            scenario,
            testRun,
          );

        testRunService.update(
          testRun.id,
          result.execution.testRun,
        );

        for (
          const failure of
          result.evaluation.failures
        ) {
          failureRepository.create(
            failure,
          );
        }

        const failure =
          result.evaluation.failures[0] ??
          null;

        testResultRepository.create({
          id: crypto.randomUUID(),
          runId: testRun.id,
          scenarioId: scenario.id,
          status:
            result.evaluation.evaluation
              .passed
              ? "passed"
              : "failed",
          score:
            result.evaluation.evaluation
              .score,
          expectedBehavior:
            scenario.expectedBehavior,
          actualBehavior:
            result.execution.execution
              .output
              ? [
                  result.execution.execution
                    .output,
                ]
              : [],
          failureId:
            failure?.id ?? null,
          durationMs:
            result.execution.execution
              .durationMs,
          createdAt:
            new Date().toISOString(),
        });

        agent.totalTests += 1;

        if (
          result.evaluation.evaluation
            .passed
        ) {
          agent.passedTests += 1;
        } else {
          agent.failedTests += 1;
        }

        agent.reliabilityScore =
          agent.totalTests > 0
            ? Math.round(
                (agent.passedTests /
                  agent.totalTests) *
                  100,
              )
            : 0;
        agent.updatedAt =
          new Date().toISOString();

        return reply.status(201).send({
          testRun:
            result.execution.testRun,
          evaluation:
            result.evaluation.evaluation,
          failures:
            result.evaluation.failures,
          trace: result.trace,
        });
      } catch (error) {
        testRunService.update(
          testRun.id,
          {
            status: "failed",
            completedAt:
              new Date().toISOString(),
          },
        );

        throw error;
      }
    },
  );

  app.post<{
    Body: unknown;
  }>(
    "/test-runs/batch",
    async (
      request: FastifyRequest<{
        Body: unknown;
      }>,
      reply: FastifyReply,
    ) => {
      const input = createBatchRunSchema.parse(request.body);

      const batchResult = await batchEvaluationService.runBatch(
        input.agentId,
        input.scenarioIds,
      );

      return reply.status(201).send(batchResult);
    },
  );
}