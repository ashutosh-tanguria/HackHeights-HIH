import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  agentRepository,
} from "../container";
import {
  AgentService,
} from "../services";
import {
  createAgentSchema,
  updateAgentSchema,
} from "../schemas";

const agentService = new AgentService(
  agentRepository,
);

export async function agentController(
  app: FastifyInstance,
) {
  app.get(
    "/agents",
    async () => {
      return agentService.findAll();
    },
  );

  app.get<{
    Params: {
      agentId: string;
    };
  }>(
    "/agents/:agentId",
    async (
      request: FastifyRequest<{
        Params: {
          agentId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const agent = agentService.findById(
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

      return agent;
    },
  );

  app.post<{
    Body: unknown;
  }>(
    "/agents",
    async (
      request: FastifyRequest<{
        Body: unknown;
      }>,
      reply: FastifyReply,
    ) => {
      const input = createAgentSchema.parse(
        request.body,
      );

      const agent = agentService.create(input);

      return reply.status(201).send(agent);
    },
  );

  app.put<{
    Params: {
      agentId: string;
    };
    Body: unknown;
  }>(
    "/agents/:agentId",
    async (
      request: FastifyRequest<{
        Params: {
          agentId: string;
        };
        Body: unknown;
      }>,
      reply: FastifyReply,
    ) => {
      const input = updateAgentSchema.parse(
        request.body,
      );

      const agent = agentService.update(
        request.params.agentId,
        input,
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

      return agent;
    },
  );

  app.delete<{
    Params: {
      agentId: string;
    };
  }>(
    "/agents/:agentId",
    async (
      request: FastifyRequest<{
        Params: {
          agentId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const deleted = agentService.delete(
        request.params.agentId,
      );

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "AGENT_NOT_FOUND",
            message: "Agent not found",
          },
        });
      }

      return {
        success: true,
      };
    },
  );
}