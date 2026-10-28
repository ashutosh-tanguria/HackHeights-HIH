import type { FastifyInstance } from "fastify";

type Scenario = {
  id: string;
  title: string;
  category:
    | "basic_reliability"
    | "tool_safety"
    | "adversarial"
    | "prompt_injection"
    | "destructive_action";
  difficulty: "easy" | "medium" | "hard" | "critical";
  userInput: string;
  expectedBehavior: string[];
  forbiddenBehavior: string[];
  successCriteria: string[];
  status: "draft" | "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

const scenarios: Scenario[] = [];

export async function scenarioRoutes(app: FastifyInstance) {
  app.get("/scenarios", async () => {
    return scenarios;
  });

  app.get<{ Params: { scenarioId: string } }>(
    "/scenarios/:scenarioId",
    async (request, reply) => {
      const scenario = scenarios.find(
        (item) => item.id === request.params.scenarioId,
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

      return scenario;
    },
  );

  app.post<{
    Body: {
      title: string;
      category: Scenario["category"];
      difficulty: Scenario["difficulty"];
      userInput: string;
      expectedBehavior: string[];
      forbiddenBehavior: string[];
      successCriteria: string[];
    };
  }>("/scenarios", async (request, reply) => {
    const now = new Date().toISOString();

    const scenario: Scenario = {
      id: crypto.randomUUID(),
      title: request.body.title,
      category: request.body.category,
      difficulty: request.body.difficulty,
      userInput: request.body.userInput,
      expectedBehavior: request.body.expectedBehavior,
      forbiddenBehavior: request.body.forbiddenBehavior,
      successCriteria: request.body.successCriteria,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    scenarios.push(scenario);

    return reply.status(201).send(scenario);
  });
}