import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  agentRepository,
  testRunRepository,
} from "../container";
import {
  ReliabilityService,
} from "../services";

const reliabilityService =
  new ReliabilityService();

export async function reliabilityController(
  app: FastifyInstance,
) {
  app.get(
    "/reliability",
    async () => {
      const agents =
        agentRepository.findAll();

      const runs =
        testRunRepository.findAll();

      const reliability =
        reliabilityService.calculate(
          runs,
        );

      return {
        reliabilityScore:
          reliability.reliabilityScore,
        totalTests:
          reliability.totalTests,
        passedTests:
          reliability.passedTests,
        failedTests:
          reliability.failedTests,
        totalAgents: agents.length,
        activeAgents:
          agents.filter(
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
    async (
      request: FastifyRequest<{
        Params: {
          agentId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
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

      const reliability =
        reliabilityService.calculate(
          runs,
          agent,
        );

      return {
        agentId: agent.id,
        reliabilityScore:
          reliability.reliabilityScore,
        totalTests:
          reliability.totalTests,
        passedTests:
          reliability.passedTests,
        failedTests:
          reliability.failedTests,
        runs: runs.map((run) => ({
          id: run.id,
          score:
            run.reliabilityScore,
          status: run.status,
          passedTests:
            run.passedTests,
          failedTests:
            run.failedTests,
          createdAt:
            run.createdAt,
        })),
      };
    },
  );
}