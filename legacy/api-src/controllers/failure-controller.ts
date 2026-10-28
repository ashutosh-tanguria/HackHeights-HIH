import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  failureRepository,
  diagnosisService,
} from "../container";
import { updateFailureSchema } from "../schemas";

export async function failureController(
  app: FastifyInstance,
) {
  app.get(
    "/failures",
    async () => {
      return failureRepository.findAll();
    },
  );

  app.get<{
    Params: {
      failureId: string;
    };
  }>(
    "/failures/:failureId",
    async (
      request: FastifyRequest<{
        Params: {
          failureId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const failure =
        failureRepository.findById(
          request.params.failureId,
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
    Params: {
      failureId: string;
    };
    Body: unknown;
  }>(
    "/failures/:failureId",
    async (
      request: FastifyRequest<{
        Params: {
          failureId: string;
        };
        Body: unknown;
      }>,
      reply: FastifyReply,
    ) => {
      const input =
        updateFailureSchema.parse(
          request.body,
        );

      const failure =
        failureRepository.findById(
          request.params.failureId,
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

      failure.status = input.status;
      failure.resolvedAt =
        input.status === "resolved"
          ? new Date().toISOString()
          : null;

      return failure;
    },
  );

  app.get<{
    Params: {
      failureId: string;
    };
  }>(
    "/failures/:failureId/diagnosis",
    async (
      request: FastifyRequest<{
        Params: {
          failureId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const failure =
        failureRepository.findById(
          request.params.failureId,
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

      const diagnosis = await diagnosisService.diagnoseFailure(
        request.params.failureId,
      );

      return diagnosis;
    },
  );

  app.post<{
    Params: {
      failureId: string;
    };
  }>(
    "/failures/:failureId/diagnose",
    async (
      request: FastifyRequest<{
        Params: {
          failureId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const failure =
        failureRepository.findById(
          request.params.failureId,
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

      const diagnosis = await diagnosisService.diagnoseFailure(
        request.params.failureId,
        true,
      );

      return diagnosis;
    },
  );
}