import type { FastifyInstance } from "fastify";

type RegressionStatus =
  | "improved"
  | "stable"
  | "regressed"
  | "not_evaluated";

type RegressionResult = {
  id: string;
  agentId: string;
  previousVersionId: string;
  currentVersionId: string;
  previousScore: number | null;
  currentScore: number | null;
  scoreChange: number | null;
  status: RegressionStatus;
  newFailures: number;
  resolvedFailures: number;
  createdAt: string;
};

const regressionResults: RegressionResult[] = [];

export async function regressionRoutes(
  app: FastifyInstance,
) {
  app.get<{ Params: { agentId: string } }>(
    "/regression/:agentId",
    async (request) => {
      return regressionResults.filter(
        (result) =>
          result.agentId === request.params.agentId,
      );
    },
  );

  app.post<{
    Params: { agentId: string };
    Body: {
      previousVersionId: string;
      currentVersionId: string;
    };
  }>(
    "/regression/:agentId/compare",
    async (request, reply) => {
      const result: RegressionResult = {
        id: crypto.randomUUID(),
        agentId: request.params.agentId,
        previousVersionId:
          request.body.previousVersionId,
        currentVersionId:
          request.body.currentVersionId,
        previousScore: null,
        currentScore: null,
        scoreChange: null,
        status: "not_evaluated",
        newFailures: 0,
        resolvedFailures: 0,
        createdAt: new Date().toISOString(),
      };

      regressionResults.push(result);

      return reply.status(201).send(result);
    },
  );
}