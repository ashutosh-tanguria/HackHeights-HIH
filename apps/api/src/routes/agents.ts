import type { FastifyInstance } from "fastify";

type Agent = {
  id: string;
  name: string;
  description: string;
  integration: "http" | "openai" | "custom";
  endpoint: string | null;
  model: string | null;
  status:
    | "active"
    | "inactive"
    | "error"
    | "not_configured";
  reliabilityScore: number | null;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  createdAt: string;
  updatedAt: string;
};

const agents: Agent[] = [];

export async function agentRoutes(
  app: FastifyInstance,
) {
  app.get("/agents", async () => {
    return agents;
  });

  app.get<{
    Params: {
      agentId: string;
    };
  }>(
    "/agents/:agentId",
    async (request, reply) => {
      const agent = agents.find(
        (item) =>
          item.id === request.params.agentId,
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
    Body: {
      name: string;
      description?: string;
      integration: "http" | "openai" | "custom";
      endpoint?: string | null;
      model?: string | null;
    };
  }>(
    "/agents",
    async (request, reply) => {
      const now =
        new Date().toISOString();

      const agent: Agent = {
        id: crypto.randomUUID(),
        name: request.body.name,
        description:
          request.body.description ?? "",
        integration:
          request.body.integration,
        endpoint:
          request.body.endpoint ?? null,
        model:
          request.body.model ?? null,
        status:
          request.body.integration === "openai" ||
          request.body.endpoint
            ? "active"
            : "not_configured",
        reliabilityScore: null,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        createdAt: now,
        updatedAt: now,
      };

      agents.push(agent);

      return reply
        .status(201)
        .send(agent);
    },
  );
}