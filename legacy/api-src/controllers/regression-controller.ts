import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  testRunRepository,
} from "../container";
import {
  RegressionService,
} from "../services";

const regressionService =
  new RegressionService();

export async function regressionController(
  app: FastifyInstance,
) {
  app.get<{
    Querystring: {
      baselineRunId?: string;
      currentRunId?: string;
    };
  }>(
    "/regressions",
    async (
      request: FastifyRequest<{
        Querystring: {
          baselineRunId?: string;
          currentRunId?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const {
        baselineRunId,
        currentRunId,
      } = request.query;

      if (
        !baselineRunId ||
        !currentRunId
      ) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "REGRESSION_RUNS_REQUIRED",
            message:
              "baselineRunId and currentRunId are required",
          },
        });
      }

      if (baselineRunId === currentRunId) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "SAME_RUN_COMPARISON",
            message:
              "Baseline and current test runs must be distinct",
          },
        });
      }

      const baseline =
        testRunRepository.findById(
          baselineRunId,
        );

      if (!baseline) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "BASELINE_RUN_NOT_FOUND",
            message:
              "Baseline test run not found",
          },
        });
      }

      const current =
        testRunRepository.findById(
          currentRunId,
        );

      if (!current) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "CURRENT_RUN_NOT_FOUND",
            message:
              "Current test run not found",
          },
        });
      }

      if (baseline.agentId !== current.agentId) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "DIFFERENT_AGENT_COMPARISON",
            message:
              "Baseline and current test runs must belong to the same agent",
          },
        });
      }

      return regressionService.compare(
        baseline,
        current,
      );
    },
  );
}