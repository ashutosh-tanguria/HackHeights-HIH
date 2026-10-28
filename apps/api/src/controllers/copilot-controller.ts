import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  copilotService,
  healthService,
  agentRepository,
} from "../container";

export async function copilotController(app: FastifyInstance) {
  app.get("/copilot", async () => {
    return copilotService.getGlobalCopilotAnalysis();
  });

  app.get<{
    Params: {
      agentId: string;
    };
  }>(
    "/copilot/:agentId",
    async (
      request: FastifyRequest<{
        Params: {
          agentId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const agent = agentRepository.findById(request.params.agentId);
      if (!agent) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "AGENT_NOT_FOUND",
            message: "Agent not found",
          },
        });
      }

      return copilotService.getAgentCopilotAnalysis(request.params.agentId);
    },
  );

  app.get("/health-score", async () => {
    return healthService.calculateAgentHealth();
  });

  app.get<{
    Params: {
      agentId: string;
    };
  }>(
    "/health-score/:agentId",
    async (
      request: FastifyRequest<{
        Params: {
          agentId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const agent = agentRepository.findById(request.params.agentId);
      if (!agent) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "AGENT_NOT_FOUND",
            message: "Agent not found",
          },
        });
      }

      return healthService.calculateAgentHealth(request.params.agentId);
    },
  );
}
