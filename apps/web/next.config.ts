import type { NextConfig } from "next";
import * as path from "node:path";

// Local runs: read the repository's .env (BAYORA_ADMIN_KEY, BAYORA_API_URL) so the server-side proxy can authenticate.
// In Docker these come from docker-compose.yml.
for (const candidate of [path.resolve(process.cwd(), "../../.env"), path.resolve(process.cwd(), ".env")]) {
  try {
    process.loadEnvFile(candidate);
    break;
  } catch {
    /* not present */
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
