import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app
  .listen({ port: env.PORT, host: env.HOST })
  .then(() => {
    if (env.GENERATED_SECRETS.length > 0) {
      app.log.warn(`Ephemeral secrets generated for: ${env.GENERATED_SECRETS.join(", ")}. Run 'pnpm setup' to create a .env with persistent secrets.`);
    }
    if (env.PROVIDER === "mock") app.log.warn("TARGET_LLM_PROVIDER=mock: all model output is MOCK and cannot support MEASURED claims.");
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
