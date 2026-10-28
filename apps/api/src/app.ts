import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env";
import { auditService } from "./services/audit/audit-service";
import { Ctx, bayoraRoutes, createCtx } from "./routes/bayora-routes";

export function createApp(ctx: Ctx = createCtx()) {
  const app = Fastify({ logger: env.NODE_ENV !== "test", bodyLimit: 256 * 1024 });
  app.register(cors, { origin: env.CORS_ORIGIN.split(",") });
  app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
    const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
    reply.status(status).send({ error: { code: status, message: status === 500 ? "Internal error" : err.message } });
  });
  app.register(async (instance) => bayoraRoutes(instance, ctx));
  app.addHook("onReady", async () => {
    auditService(); // creates the genesis event on first start
  });
  return app;
}
