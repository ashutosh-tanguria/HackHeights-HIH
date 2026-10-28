import { FastifyInstance } from "fastify";
import { Tenant, issueToken } from "./tokens";

export interface AccessCheck {
  name: string;
  request: string;
  expectedStatus: number;
  gotStatus: number;
  passed: boolean;
}

/**
 * Live access-control check. Sends real HTTP requests to this server (in-process, via inject) with forged,
 * expired, mis-scoped and valid tokens, and records the real status codes.
 */
export async function runAccessSelfTest(app: FastifyInstance): Promise<AccessCheck[]> {
  const eid = `selftest-${Date.now().toString(36)}`;
  const tok = (tenant: Tenant, extra: Parameters<typeof issueToken>[0] extends infer T ? Partial<T> : never = {}) => issueToken({ evaluationId: eid, tenant, ...extra }).token;
  const red = tok("red");
  const blue = tok("blue");
  const forged = red.slice(0, -3) + (red.endsWith("AAA") ? "BBB" : "AAA");
  const expired = issueToken({ evaluationId: eid, tenant: "red", now: Math.floor(Date.now() / 1000) - 7200, ttlSeconds: 60 }).token;
  const noInference = issueToken({ evaluationId: eid, tenant: "red", capabilities: ["evaluations:read"] }).token;

  const cases: Array<{ name: string; method: "GET" | "POST"; url: string; token?: string; payload?: unknown; expect: number }> = [
    { name: "No token on inference", method: "POST", url: "/v1/chat/completions", payload: { prompt: "x" }, expect: 401 },
    { name: "Forged token signature", method: "GET", url: "/api/v1/whoami", token: forged, expect: 401 },
    { name: "Expired token", method: "GET", url: "/api/v1/whoami", token: expired, expect: 401 },
    { name: "Red reads Blue defence config", method: "GET", url: "/api/v1/defense/config", token: red, expect: 403 },
    { name: "Blue reads Red payload corpus", method: "GET", url: "/api/v1/payloads", token: blue, expect: 403 },
    { name: "Token without model.inference capability calls inference", method: "POST", url: "/v1/chat/completions", token: noInference, payload: { prompt: "x" }, expect: 403 },
    { name: "Red token cannot mint tokens", method: "POST", url: "/api/v1/tokens", token: red, payload: { tenant: "admin" }, expect: 401 },
    { name: "Red cannot start probes or evaluations", method: "POST", url: "/api/v1/probes/run", token: red, expect: 401 },
    { name: "Control: Red token is accepted (whoami)", method: "GET", url: "/api/v1/whoami", token: red, expect: 200 },
    { name: "Control: Red reads its own payload corpus", method: "GET", url: "/api/v1/payloads", token: red, expect: 200 },
  ];

  const out: AccessCheck[] = [];
  for (const c of cases) {
    const r = await app.inject({ method: c.method, url: c.url, headers: c.token ? { authorization: `Bearer ${c.token}` } : {}, payload: c.payload as any });
    out.push({ name: c.name, request: `${c.method} ${c.url}`, expectedStatus: c.expect, gotStatus: r.statusCode, passed: r.statusCode === c.expect });
  }

  // Tenant comes from the token only: a body claiming another tenant must not change who the server thinks we are.
  const spoof = await app.inject({ method: "GET", url: "/api/v1/whoami?tenant=admin", headers: { authorization: `Bearer ${red}`, "x-bayora-tenant": "admin" } });
  const who = spoof.statusCode === 200 ? (spoof.json() as { tenant: string }).tenant : "error";
  out.push({ name: "Tenant spoof via query/header is ignored (server still sees 'red')", request: "GET /api/v1/whoami?tenant=admin", expectedStatus: 200, gotStatus: who === "red" ? 200 : 418, passed: who === "red" });
  return out;
}
