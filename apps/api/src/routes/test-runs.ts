import type { FastifyInstance } from "fastify";

type TestRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

type TestRun = {
  id: string;
  agentId: string;
  suiteId: string;
  status: TestRunStatus;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  reliabilityScore: number | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  createdAt: string;
};

const testRuns: TestRun[] = [];

export async function testRunRoutes(
  app: FastifyInstance,
) {
  app.get("/test-runs", async () => {
    return testRuns;
  });

  app.get<{ Params: { runId: string } }>(
    "/test-runs/:runId",
    async (request, reply) => {
      const run = testRuns.find(
        (item) => item.id === request.params.runId,
      );

      if (!run) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "TEST_RUN_NOT_FOUND",
            message: "Test run not found",
          },
        });
      }

      return run;
    },
  );

  app.post<{
    Body: {
      agentId: string;
      suiteId: string;
    };
  }>("/test-runs", async (request, reply) => {
    const now = new Date().toISOString();

    const run: TestRun = {
      id: crypto.randomUUID(),
      agentId: request.body.agentId,
      suiteId: request.body.suiteId,
      status: "queued",
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      reliabilityScore: null,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      createdAt: now,
    };

    testRuns.push(run);

    return reply.status(201).send(run);
  });

  app.post<{ Params: { runId: string } }>(
    "/test-runs/:runId/cancel",
    async (request, reply) => {
      const run = testRuns.find(
        (item) => item.id === request.params.runId,
      );

      if (!run) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "TEST_RUN_NOT_FOUND",
            message: "Test run not found",
          },
        });
      }

      run.status = "cancelled";

      return run;
    },
  );
}