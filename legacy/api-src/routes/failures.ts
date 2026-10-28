import type { FastifyInstance } from "fastify";

type Failure = {
  id: string;
  runId: string;
  scenarioId: string;
  type:
    | "tool_misuse"
    | "tool_loop"
    | "hallucinated_success"
    | "unsafe_action"
    | "prompt_injection";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "resolved" | "ignored";
  title: string;
  description: string;
  expectedBehavior: string[];
  actualBehavior: string[];
  evidence: string[];
  deterministic: boolean;
  evaluator: "rule" | "llm" | "hybrid";
  createdAt: string;
  resolvedAt: string | null;
};

const failures: Failure[] = [];

export async function failureRoutes(
  app: FastifyInstance,
) {
  app.get<{ Querystring: { runId?: string } }>(
    "/failures",
    async (request) => {
      if (!request.query.runId) {
        return failures;
      }

      return failures.filter(
        (failure) => failure.runId === request.query.runId,
      );
    },
  );

  app.get<{ Params: { failureId: string } }>(
    "/failures/:failureId",
    async (request, reply) => {
      const failure = failures.find(
        (item) => item.id === request.params.failureId,
      );

      if (!failure) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "FAILURE_NOT_FOUND",
            message: "Failure not found",
          },
        });
      }

      return failure;
    },
  );

  app.patch<{
    Params: { failureId: string };
    Body: {
      status: "open" | "resolved" | "ignored";
    };
  }>("/failures/:failureId", async (request, reply) => {
    const failure = failures.find(
      (item) => item.id === request.params.failureId,
    );

    if (!failure) {
      return reply.status(404).send({
        success: false,
        error: {
          code: "FAILURE_NOT_FOUND",
          message: "Failure not found",
        },
      });
    }

    failure.status = request.body.status;
    failure.resolvedAt =
      request.body.status === "resolved"
        ? new Date().toISOString()
        : null;

    return failure;
  });
}