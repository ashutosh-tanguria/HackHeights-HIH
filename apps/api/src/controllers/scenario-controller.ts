import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  scenarioRepository,
  adversarialGeneratorService,
} from "../container";
import {
  ScenarioService,
} from "../services";
import {
  createScenarioSchema,
  updateScenarioSchema,
  generateAdversarialTestsSchema,
  batchCreateScenariosSchema,
  type CreateScenarioInput,
} from "../schemas";

const scenarioService = new ScenarioService(
  scenarioRepository,
);

export async function scenarioController(
  app: FastifyInstance,
) {
  app.get(
    "/scenarios",
    async () => {
      return scenarioService.findAll();
    },
  );

  app.get<{
    Params: {
      scenarioId: string;
    };
  }>(
    "/scenarios/:scenarioId",
    async (
      request: FastifyRequest<{
        Params: {
          scenarioId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const scenario =
        scenarioService.findById(
          request.params.scenarioId,
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
    Body: unknown;
  }>(
    "/scenarios",
    async (
      request: FastifyRequest<{
        Body: unknown;
      }>,
      reply: FastifyReply,
    ) => {
      const input =
        createScenarioSchema.parse(
          request.body,
        );

      const scenario =
        scenarioService.create(input);

      return reply.status(201).send(scenario);
    },
  );

  app.put<{
    Params: {
      scenarioId: string;
    };
    Body: unknown;
  }>(
    "/scenarios/:scenarioId",
    async (
      request: FastifyRequest<{
        Params: {
          scenarioId: string;
        };
        Body: unknown;
      }>,
      reply: FastifyReply,
    ) => {
      const input =
        updateScenarioSchema.parse(
          request.body,
        );

      const scenario =
        scenarioService.update(
          request.params.scenarioId,
          input,
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

  app.delete<{
    Params: {
      scenarioId: string;
    };
  }>(
    "/scenarios/:scenarioId",
    async (
      request: FastifyRequest<{
        Params: {
          scenarioId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const deleted =
        scenarioService.delete(
          request.params.scenarioId,
        );

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "SCENARIO_NOT_FOUND",
            message: "Scenario not found",
          },
        });
      }

      return {
        success: true,
      };
    },
  );

  app.post<{
    Params: {
      scenarioId: string;
    };
    Body: unknown;
  }>(
    "/scenarios/:scenarioId/generate-tests",
    async (
      request: FastifyRequest<{
        Params: {
          scenarioId: string;
        };
        Body: unknown;
      }>,
      reply: FastifyReply,
    ) => {
      const scenario =
        scenarioService.findById(
          request.params.scenarioId,
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

      const input = generateAdversarialTestsSchema.parse({
        ...(typeof request.body === "object" && request.body !== null ? request.body : {}),
        scenarioId: request.params.scenarioId,
      });

      const generated = await adversarialGeneratorService.generateTests(input);

      return {
        scenarios: generated,
        count: generated.length,
        sourceScenarioId: scenario.id,
      };
    },
  );

  app.post<{
    Body: unknown;
  }>(
    "/scenarios/batch-create",
    async (
      request: FastifyRequest<{
        Body: unknown;
      }>,
      reply: FastifyReply,
    ) => {
      const input = batchCreateScenariosSchema.parse(request.body);

      const createdScenarios = input.scenarios.map((sc: CreateScenarioInput) =>
        scenarioService.create(sc),
      );

      return reply.status(201).send({
        created: createdScenarios,
        count: createdScenarios.length,
      });
    },
  );
}