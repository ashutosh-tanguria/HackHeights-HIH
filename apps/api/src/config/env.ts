import { randomBytes } from "crypto";
import * as path from "path";

// Local runs (pnpm dev / start): read the repository's .env if present. In Docker the variables come from compose.
for (const candidate of [path.resolve(process.cwd(), ".env"), path.resolve(process.cwd(), "../../.env")]) {
  try {
    process.loadEnvFile(candidate);
    break;
  } catch {
    /* no .env at this location */
  }
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Secrets come from the environment only. If a secret is missing we generate an
 * ephemeral random one for this process (tokens/keys then die on restart) and
 * report that in /health so nobody mistakes it for a configured deployment.
 */
const generated: string[] = [];
function secret(name: string): string {
  const v = process.env[name];
  if (v && v.length >= 16) return v;
  generated.push(name);
  return randomBytes(32).toString("hex");
}

export type Provider = "ollama" | "openai" | "mock";

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  HOST: process.env.HOST ?? "0.0.0.0",
  PORT: num("PORT", 4000),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  DATA_DIR: process.env.BAYORA_DATA_DIR ?? ".bayora",

  TOKEN_SECRET: secret("BAYORA_TOKEN_SECRET"),
  ADMIN_KEY: secret("BAYORA_ADMIN_KEY"),
  RED_ENROLL_SECRET: secret("BAYORA_RED_ENROLL_SECRET"),
  BLUE_ENROLL_SECRET: secret("BAYORA_BLUE_ENROLL_SECRET"),
  GENERATED_SECRETS: generated,

  PROVIDER: (process.env.TARGET_LLM_PROVIDER ?? "mock") as Provider,
  ENDPOINT: process.env.TARGET_LLM_ENDPOINT ?? "http://localhost:11434",
  MODEL: process.env.TARGET_LLM_MODEL ?? "qwen2.5:0.5b",
  API_KEY: process.env.TARGET_LLM_API_KEY ?? "",
  MODEL_TIMEOUT_MS: num("TARGET_LLM_TIMEOUT_MS", 120000),

  RATE_LIMIT_MAX: num("GATEWAY_RATE_LIMIT_MAX", 300),
  RATE_LIMIT_WINDOW_MS: num("GATEWAY_RATE_LIMIT_WINDOW_MS", 60000),
  CONCURRENCY_CAP: num("GATEWAY_CONCURRENCY_CAP", 4),
  TOKEN_TTL_SECONDS: num("BAYORA_TOKEN_TTL_SECONDS", 900),
  TOKEN_MAX_TTL_SECONDS: 3600,

  BLUE_FILTER_MODE: (process.env.BLUE_FILTER_MODE ?? "remote") as "remote" | "local",
  BLUE_FILTER_URL: process.env.BLUE_FILTER_URL ?? "http://blue:8081",

  RED_CONTAINER: process.env.RED_CONTAINER ?? "bayora-red",
  BLUE_CONTAINER: process.env.BLUE_CONTAINER ?? "bayora-blue",
  TARGET_CONTAINER: process.env.TARGET_CONTAINER ?? "bayora-target",
  GATEWAY_CONTAINER: process.env.GATEWAY_CONTAINER ?? "bayora-gateway",
  DOCKER_BIN: process.env.DOCKER_BIN ?? "docker",
};
