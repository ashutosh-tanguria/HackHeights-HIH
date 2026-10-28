import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { traceStore } from "../container";

export async function traceController(
  app: FastifyInstance,
) {
  app.get<{
    Params: {
      traceId: string;
    };
  }>(
    "/traces/:traceId",
    async (
      request: FastifyRequest<{
        Params: {
          traceId: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const trace =
        traceStore.findById(
          request.params.traceId,
        );

      if (!trace) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "TRACE_NOT_FOUND",
            message: "Trace not found",
          },
        });
      }

      return trace;
    },
  );
}