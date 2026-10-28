import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export async function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const statusCode =
    error.statusCode && error.statusCode >= 400
      ? error.statusCode
      : 500;

  reply.status(statusCode).send({
    success: false,
    error: {
      code: error.code ?? "INTERNAL_SERVER_ERROR",
      message:
        statusCode >= 500
          ? "Internal server error"
          : error.message,
    },
  });
}