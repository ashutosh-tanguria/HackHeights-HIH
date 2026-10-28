import type { FastifyInstance } from "fastify";
import {
  agentRepository,
  testRunRepository,
} from "../container";

export async function reliabilityRoutes(
  app: FastifyInstance,
) {
  app.get(
    "/reliability",
    async () => {
      const agents =
        agentRepository.findAll();

      const runs =
        testRunRepository.findAll();

      const totalTests = runs.reduce(
        (sum, run) =>
          sum + run.totalTests,
        0,
      );

      const passedTests = runs.reduce(
        (sum, run) =>
          sum + run.passedTests,
        0,
      );

      const failedTests = runs.reduce(
        (sum, run) =>
          sum + run.failedTests,
        0,
      );

      const reliabilityScore =
        totalTests > 0
          ? (passedTests / totalTests) * 100
          : 0;

      return {
        reliabilityScore,
        totalTests,
        passedTests,
        failedTests,
        totalAgents: agents.length,
        activeAgents: agents.filter(
          (agent) =>
            agent.status === "active",
        ).length,
      };
    },
  );

  app.get<{
    Params: {
      agentId: string;
    };
  }>(
    "/reliability/:agentId",
    async (request, reply) => {
      const agent =
        agentRepository.findById(
          request.params.agentId,
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

      const runs =
        testRunRepository
          .findAll()
          .filter(
            (run) =>
              run.agentId === agent.id,
          );

      const totalTests = runs.reduce(
        (sum, run) =>
          sum + run.totalTests,
        0,
      );

      const passedTests = runs.reduce(
        (sum, run) =>
          sum + run.passedTests,
        0,
      );

      const failedTests = runs.reduce(
        (sum, run) =>
          sum + run.failedTests,
        0,
      );

      return {
        agentId: agent.id,
        reliabilityScore:
          totalTests > 0
            ? (passedTests / totalTests) *
              100
            : 0,
        totalTests,
        passedTests,
        failedTests,
        runs: runs.map((run) => ({
          id: run.id,
          score: run.reliabilityScore,
          status: run.status,
          passedTests: run.passedTests,
          failedTests: run.failedTests,
          createdAt: run.createdAt,
        })),
      };
    },
  );
}