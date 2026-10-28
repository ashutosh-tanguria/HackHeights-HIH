#!/usr/bin/env node
// Creates .env from .env.example with freshly generated random secrets. Never overwrites an existing .env.
//   pnpm setup
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, ".env");
if (existsSync(target)) {
  console.log(".env already exists, leaving it untouched.");
  process.exit(0);
}
const keys = ["BAYORA_TOKEN_SECRET", "BAYORA_ADMIN_KEY", "BAYORA_RED_ENROLL_SECRET", "BAYORA_BLUE_ENROLL_SECRET"];
let text = readFileSync(resolve(root, ".env.example"), "utf-8");
for (const k of keys) text = text.replace(new RegExp(`^${k}=.*$`, "m"), `${k}=${randomBytes(32).toString("hex")}`);
writeFileSync(target, text, { mode: 0o600 });
console.log("Created .env with random secrets. Review TARGET_LLM_PROVIDER (ollama or mock).");
