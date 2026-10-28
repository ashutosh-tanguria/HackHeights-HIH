import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env";
import { auditService } from "../services/audit/audit-service";
import { BenchmarkEvaluator, EvaluationConflict, httpGatewayCall } from "../services/evaluation/benchmark-evaluator";
import { loadManifest } from "../services/evaluation/manifest";
import { GatewayCore, GatewayError } from "../services/gateway/gateway-core";
import { ChatMessage, ProviderError } from "../services/model/model-adapter";
import { BlueUnavailableError } from "../services/defense/blue-client";
import { listAnomalies, recordAnomaly } from "../services/security/anomalies";
import { IsolationService } from "../services/security/isolation-service";
import { SideChannelMode, SideChannelService } from "../services/security/side-channel-service";
import { buildThreatModel } from "../services/security/threat-model";
import { AuthError, Tenant, TokenClaims, authorize, isAdminKey, issueToken, verifyToken, Capability } from "../services/security/tokens";
import { runAccessSelfTest } from "../services/security/access-selftest";

export interface Ctx {
  gateway: GatewayCore;
  isolation: IsolationService;
  sideChannel: SideChannelService;
  evaluator: BenchmarkEvaluator;
  revoked: Set<string>;
  lab: { busy: string | null };
  scJob: { id: string | null; mode: SideChannelMode | null; status: "idle" | "running" | "completed" | "failed"; done: number; total: number; error: string | null };
}

export function createCtx(): Ctx {
  const gateway = new GatewayCore();
  return {
    gateway,
    isolation: new IsolationService(),
    sideChannel: new SideChannelService(gateway),
    evaluator: new BenchmarkEvaluator(httpGatewayCall, () => gateway.model.ping()),
    revoked: new Set(),
    lab: { busy: null },
    scJob: { id: null, mode: null, status: "idle", done: 0, total: 0, error: null },
  };
}

type Principal = { kind: "admin" } | { kind: "token"; claims: TokenClaims };

export async function bayoraRoutes(app: FastifyInstance, ctx: Ctx) {
  const audit = () => auditService();

  // ---------- auth helpers ----------
  function denyAndLog(req: FastifyRequest, reply: FastifyReply, status: 401 | 403, message: string, resource: string, claims?: TokenClaims) {
    const tenant = claims?.tenant ?? "anonymous";
    const ev = audit().append({
      evaluationId: claims?.evaluationId ?? "UNAUTHENTICATED",
      actor: tenant,
      action: "ACCESS_DENIED",
      targetResource: resource,
      payload: { status, reason: message, method: req.method, path: req.url.split("?")[0] },
      summary: `HTTP ${status} for '${tenant}' on ${resource}: ${message}`,
    });
    recordAnomaly({
      kind: status === 403 ? "CROSS_BOUNDARY_ATTEMPT" : "AUTH_FAILURE",
      severity: status === 403 ? "warning" : "info",
      tenant,
      summary: status === 403 ? `Tenant '${tenant}' was refused access to ${resource} (HTTP 403).` : `Request to ${resource} refused: ${message} (HTTP 401).`,
      auditIndex: ev.index,
    });
    return reply.status(status).send({ error: { code: status, message } });
  }

  /** Admin key or a token holding `cap` for `resource`. Returns null after replying on failure. */
  function principal(req: FastifyRequest, reply: FastifyReply, cap: Capability | null, resource: string): Principal | null {
    const key = req.headers["x-bayora-admin-key"];
    if (typeof key === "string" && isAdminKey(key)) return { kind: "admin" };
    const header = req.headers.authorization;
    if (!header) {
      if (typeof key === "string") denyAndLog(req, reply, 401, "Invalid admin key", resource);
      else denyAndLog(req, reply, 401, "Missing credentials (admin key or capability token)", resource);
      return null;
    }
    let claims: TokenClaims;
    try {
      claims = verifyToken(header);
      if (ctx.revoked.has(claims.evaluationId)) throw new AuthError(401, "Evaluation session was revoked");
    } catch (e) {
      denyAndLog(req, reply, 401, (e as AuthError).message, resource);
      return null;
    }
    if (cap) {
      try {
        authorize(claims, cap, resource);
      } catch (e) {
        denyAndLog(req, reply, 403, (e as AuthError).message, resource, claims);
        return null;
      }
    }
    return { kind: "token", claims };
  }

  const adminOnly = (req: FastifyRequest, reply: FastifyReply, resource: string): boolean => {
    const key = req.headers["x-bayora-admin-key"];
    if (typeof key === "string" && isAdminKey(key)) return true;
    denyAndLog(req, reply, 401, "Admin key required", resource);
    return false;
  };

  // ---------- health ----------
  app.get("/health", async () => ({
    status: "ok",
    service: "bayora-gateway",
    provider: ctx.gateway.model.provider,
    model: ctx.gateway.model.model,
    isMock: ctx.gateway.model.isMock,
    blueFilterMode: env.BLUE_FILTER_MODE,
    ephemeralSecrets: env.GENERATED_SECRETS,
    auditEvents: audit().count(),
  }));

  // ---------- tokens ----------
  app.post("/api/v1/enroll", async (req, reply) => {
    const secret = req.headers["x-bayora-enroll-secret"];
    const match = (s: string) => typeof secret === "string" && isAdminKey(secret, s);
    // The tenant is whichever secret matched. Nothing in the body can choose it.
    const tenant: Tenant | null = match(env.RED_ENROLL_SECRET) ? "red" : match(env.BLUE_ENROLL_SECRET) ? "blue" : null;
    if (!tenant) return denyAndLog(req, reply, 401, "Invalid enrolment secret", "tokens/enroll");
    const evaluationId = `session-${new Date().toISOString().slice(0, 10)}`;
    const { token, claims } = issueToken({ evaluationId, tenant, ttlSeconds: 300, blue: process.env.BLUE_DEFENSE_DEFAULT !== "off" });
    audit().append({ evaluationId, actor: tenant, action: "CAPABILITY_TOKEN_ISSUED", targetResource: `tokens/${tenant}`, payload: { jti: claims.jti, capabilities: claims.capabilities, exp: claims.exp, via: "enroll" }, summary: `Capability token issued to ${tenant} runner (TTL ${claims.exp - claims.iat}s).` });
    return { token, tenant, expiresAt: claims.exp, capabilities: claims.capabilities };
  });

  app.post("/api/v1/tokens", async (req, reply) => {
    if (!adminOnly(req, reply, "tokens/issue")) return;
    const b = (req.body ?? {}) as { tenant?: string; evaluationId?: string; ttlSeconds?: number; blue?: boolean };
    if (b.tenant !== "red" && b.tenant !== "blue" && b.tenant !== "admin") return reply.status(400).send({ error: { code: 400, message: "tenant must be red, blue or admin" } });
    const evaluationId = b.evaluationId ?? `session-${new Date().toISOString().slice(0, 10)}`;
    const { token, claims } = issueToken({ evaluationId, tenant: b.tenant, ttlSeconds: b.ttlSeconds, blue: b.blue });
    audit().append({ evaluationId, actor: "admin", action: "CAPABILITY_TOKEN_ISSUED", targetResource: `tokens/${b.tenant}`, payload: { jti: claims.jti, capabilities: claims.capabilities, exp: claims.exp, via: "admin" }, summary: `Admin issued a ${b.tenant} capability token (TTL ${claims.exp - claims.iat}s).` });
    return { token, claims };
  });

  app.get("/api/v1/whoami", async (req, reply) => {
    const p = principal(req, reply, null, "tokens/whoami");
    if (!p) return;
    if (p.kind === "admin") return { tenant: "admin", via: "admin-key" };
    const { tenant, evaluationId, capabilities, scope, exp, blue } = p.claims;
    return { tenant, evaluationId, capabilities, scope, exp, blueDefenseApplied: blue };
  });

  // ---------- inference gateway ----------
  const chat = async (req: FastifyRequest, reply: FastifyReply) => {
    const p = principal(req, reply, "model.inference", "gateway/inference");
    if (!p) return;
    const claims: TokenClaims | null = p.kind === "token" ? p.claims : null;
    if (!claims) return reply.status(400).send({ error: { code: 400, message: "Inference requires a tenant capability token (admin key alone is not a tenant)." } });
    const body = (req.body ?? {}) as { messages?: unknown; prompt?: unknown; max_tokens?: number; temperature?: number; seed?: number };
    let messages: ChatMessage[];
    if (Array.isArray(body.messages)) {
      messages = body.messages as ChatMessage[];
    } else if (typeof body.prompt === "string") {
      messages = [{ role: "user", content: body.prompt }];
    } else {
      return reply.status(400).send({ error: { code: 400, message: "Provide 'messages' (array) or 'prompt' (string)" } });
    }
    const valid = messages.length > 0 && messages.length <= 32 && messages.every((m) => m && ["system", "user", "assistant"].includes(m.role) && typeof m.content === "string" && m.content.length <= 20000);
    if (!valid) return reply.status(400).send({ error: { code: 400, message: "Invalid messages: 1-32 items, roles system|user|assistant, content string <= 20000 chars" } });
    try {
      const r = await ctx.gateway.infer(claims, messages, { maxTokens: Math.min(Number(body.max_tokens) || 128, 512), temperature: body.temperature, seed: body.seed });
      const isRed = claims.tenant === "red";
      return {
        id: `bayora-${Date.now().toString(36)}`,
        object: "chat.completion",
        model: r.response?.model ?? ctx.gateway.model.model,
        choices: [{ index: 0, message: { role: "assistant", content: r.content }, finish_reason: r.blockedBy ? "content_filter" : "stop" }],
        usage: { prompt_tokens: r.response?.promptTokens ?? null, completion_tokens: r.response?.completionTokens ?? null },
        bayora: {
          provider: r.response?.provider ?? ctx.gateway.model.provider,
          model: r.response?.model ?? ctx.gateway.model.model,
          isMock: r.response?.isMock ?? ctx.gateway.model.isMock,
          refused: r.refused,
          // Red learns only that something blocked it, never which Blue stage or rule did.
          blockedBy: r.blockedBy ? (isRed ? "defence" : r.blockedBy) : null,
          blueRuleIds: isRed ? [] : r.blueRuleIds,
          blueExecution: isRed ? null : r.blueExecution,
          ttftMs: r.response?.ttftMs ?? null,
          totalMs: r.response?.totalMs ?? null,
        },
      };
    } catch (e) {
      if (e instanceof GatewayError) {
        for (const [k, v] of Object.entries(e.headers)) reply.header(k, v);
        return reply.status(e.statusCode).send({ error: { code: e.statusCode, message: e.message } });
      }
      if (e instanceof ProviderError || e instanceof BlueUnavailableError) return reply.status(502).send({ error: { code: 502, message: (e as Error).message } });
      throw e;
    }
  };
  app.post("/v1/chat/completions", chat);
  app.post("/api/v1/generate", chat);

  app.get("/v1/models", async (req, reply) => {
    const p = principal(req, reply, "model.inference", "gateway/inference");
    if (!p) return;
    return { object: "list", data: [{ id: ctx.gateway.model.model, object: "model", owned_by: ctx.gateway.model.provider, isMock: ctx.gateway.model.isMock }] };
  });

  // ---------- tenant-scoped reads (access-control surface) ----------
  app.get("/api/v1/defense/config", async (req, reply) => {
    const p = principal(req, reply, "defense:read", "defense/blue/config");
    if (!p) return;
    try {
      const d = await ctx.gateway.blue.describe();
      return { execution: d.execution, rulesSha256: d.rulesSha256, rules: d.rules };
    } catch (e) {
      return reply.status(502).send({ error: { code: 502, message: (e as Error).message } });
    }
  });

  app.get("/api/v1/payloads", async (req, reply) => {
    const p = principal(req, reply, "payloads:read", "payloads/red/corpus");
    if (!p) return;
    const m = loadManifest();
    return { count: m.cases.length, manifestSha256: m.fileSha256, cases: m.cases.map((c) => ({ caseId: c.caseId, dataset: c.dataset, expected: c.expected, promptSha256: c.promptSha256, prompt: c.prompt })) };
  });

  /** Audit view for tenants: who did what and when; payload bodies are withheld. Admin gets the full record. */
  app.get("/api/v1/telemetry", async (req, reply) => {
    const p = principal(req, reply, "audit:read-redacted", "audit/redacted");
    if (!p) return;
    const events = audit().getEvents().slice(-200);
    if (p.kind === "admin") return events;
    return events.map((e) => ({ index: e.index, timestamp: e.timestamp, actor: e.actor, action: e.action, targetResource: e.targetResource, payloadSummary: e.payloadSummary, canonicalPayload: "[REDACTED]" }));
  });

  app.get("/api/v1/anomalies", async (req, reply) => {
    const p = principal(req, reply, "audit:read-redacted", "audit/redacted");
    if (!p) return;
    return listAnomalies(100);
  });

  // ---------- admin: probes ----------
  app.post("/api/v1/probes/run", async (req, reply) => {
    if (!adminOnly(req, reply, "probes/run")) return;
    return ctx.isolation.runAll();
  });
  app.get("/api/v1/probes/latest", async (req, reply) => {
    if (!adminOnly(req, reply, "probes/latest")) return;
    return ctx.isolation.latest() ?? { status: "NONE", message: "No probe run recorded. POST /api/v1/probes/run with the stack up." };
  });

  // ---------- admin: evaluations ----------
  app.post("/api/v1/evaluations/run", async (req, reply) => {
    if (!adminOnly(req, reply, "evaluations/run")) return;
    if (ctx.lab.busy) return reply.status(409).send({ error: { code: 409, message: `Lab busy: ${ctx.lab.busy}` } });
    try {
      ctx.lab.busy = "evaluation";
      const s = await ctx.evaluator.start((req.body ?? {}) as any);
      void waitUntilDone(s.id).finally(() => (ctx.lab.busy = null));
      return reply.status(202).send({ id: s.id, status: "running", totalCases: s.total, config: s.config });
    } catch (e) {
      ctx.lab.busy = null;
      if (e instanceof ProviderError) return reply.status(502).send({ error: { code: 502, message: e.message }, status: "UNAVAILABLE" });
      if (e instanceof EvaluationConflict) return reply.status(409).send({ error: { code: 409, message: e.message } });
      throw e;
    }
  });
  async function waitUntilDone(id: string) {
    for (;;) {
      const e = BenchmarkEvaluator.get(id);
      if (!e || e.status !== "running") return;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  app.get("/api/v1/evaluations", async (req, reply) => {
    if (!adminOnly(req, reply, "evaluations/list")) return;
    return BenchmarkEvaluator.list();
  });
  app.get("/api/v1/evaluations/:id", async (req, reply) => {
    if (!adminOnly(req, reply, "evaluations/read")) return;
    const id = (req.params as { id: string }).id;
    const e = BenchmarkEvaluator.get(id);
    if (!e) return reply.status(404).send({ error: { code: 404, message: "Evaluation not found" } });
    return { ...e, progress: ctx.evaluator.getProgress(id) };
  });
  app.get("/api/v1/evaluations/:id/rows", async (req, reply) => {
    if (!adminOnly(req, reply, "evaluations/rows")) return;
    return BenchmarkEvaluator.rows((req.params as { id: string }).id);
  });
  app.post("/api/v1/evaluations/:id/cancel", async (req, reply) => {
    if (!adminOnly(req, reply, "evaluations/cancel")) return;
    const id = (req.params as { id: string }).id;
    ctx.evaluator.cancel(id);
    ctx.revoked.add(id);
    audit().append({ evaluationId: id, actor: "admin", action: "EVALUATION_CANCEL", targetResource: `evaluations/${id}`, payload: { revoked: true }, summary: `Operator cancelled evaluation ${id}; its tokens are revoked.` });
    return { status: "cancelling", id };
  });

  // ---------- admin: side channel ----------
  app.post("/api/v1/side-channel/run", async (req, reply) => {
    if (!adminOnly(req, reply, "side-channel/run")) return;
    if (ctx.lab.busy) return reply.status(409).send({ error: { code: 409, message: `Lab busy: ${ctx.lab.busy}` } });
    const b = (req.body ?? {}) as { mode?: string; samples?: number };
    const modes: SideChannelMode[] = ["shared", "resource_limited", "cache_salted"];
    const mode = modes.find((m) => m === b.mode);
    if (!mode) return reply.status(400).send({ error: { code: 400, message: `mode must be one of ${modes.join(", ")}` } });
    const samples = Math.min(Math.max(Math.floor(Number(b.samples) || 15), 5), 100);
    const ping = await ctx.gateway.model.ping();
    if (!ping.ok) return reply.status(502).send({ status: "UNAVAILABLE", error: { code: 502, message: ping.reason } });
    ctx.lab.busy = `side-channel:${mode}`;
    ctx.scJob = { id: null, mode, status: "running", done: 0, total: samples * 2, error: null };
    ctx.sideChannel
      .run(mode, samples, (done, total) => {
        ctx.scJob.done = done;
        ctx.scJob.total = total;
      })
      .then((r) => {
        ctx.scJob.status = "completed";
        ctx.scJob.id = r.id;
      })
      .catch((e: Error) => {
        ctx.scJob.status = "failed";
        ctx.scJob.error = e.message;
      })
      .finally(() => (ctx.lab.busy = null));
    return reply.status(202).send({ status: "running", mode, samplesPerState: samples });
  });
  app.get("/api/v1/side-channel/status", async (req, reply) => {
    if (!adminOnly(req, reply, "side-channel/status")) return;
    return ctx.scJob;
  });
  app.get("/api/v1/side-channel/latest", async (req, reply) => {
    if (!adminOnly(req, reply, "side-channel/latest")) return;
    return SideChannelService.latestPerMode();
  });

  // ---------- admin: audit ----------
  app.get("/api/v1/audit", async (req, reply) => {
    if (!adminOnly(req, reply, "audit/read")) return;
    const q = req.query as { limit?: string };
    const events = audit().getEvents();
    const limit = Math.min(Number(q.limit) || 200, 2000);
    return { total: events.length, events: events.slice(-limit) };
  });
  app.get("/api/v1/audit/verify", async (req, reply) => {
    if (!adminOnly(req, reply, "audit/verify")) return;
    const v = audit().verify();
    if (!v.isValid) recordAnomaly({ kind: "CHAIN_FAILURE", severity: "critical", tenant: "system", summary: `Audit verification failed at index ${v.brokenIndex}.`, auditIndex: v.brokenIndex ?? undefined });
    return v;
  });
  app.post("/api/v1/audit/tamper-demo", async (req, reply) => {
    if (!adminOnly(req, reply, "audit/tamper-demo")) return;
    const r = audit().tamperDemo(((req.body ?? {}) as { index?: number }).index);
    if (r.status === "EXECUTED") {
      audit().append({ evaluationId: "SYSTEM", actor: "admin", action: "TAMPER_DEMO", targetResource: "audit/chain", payload: { tamperedIndex: r.tamperedIndex, brokenIndexDuring: r.during.brokenIndex, restored: r.restored }, summary: `Tamper demo on event #${r.tamperedIndex}: verification failed at #${r.during.brokenIndex}, then restored (${r.restored}).` });
    }
    return r;
  });
  app.get("/api/v1/audit/export", async (req, reply) => {
    if (!adminOnly(req, reply, "audit/export")) return;
    reply.header("Content-Disposition", 'attachment; filename="bayora-audit-bundle.json"');
    return audit().exportBundle();
  });

  // ---------- admin: access control, threat model, overview ----------
  app.post("/api/v1/access/selftest", async (req, reply) => {
    if (!adminOnly(req, reply, "access/selftest")) return;
    const checks = await runAccessSelfTest(app);
    audit().append({ evaluationId: "SYSTEM", actor: "admin", action: "ACCESS_SELFTEST", targetResource: "access", payload: { checks: checks.map((c) => ({ name: c.name, expected: c.expectedStatus, got: c.gotStatus, passed: c.passed })) }, summary: `Access-control self-test: ${checks.filter((c) => c.passed).length}/${checks.length} as expected.` });
    return { passed: checks.filter((c) => c.passed).length, total: checks.length, checks };
  });

  app.get("/api/v1/threat-model", async (req, reply) => {
    if (!adminOnly(req, reply, "threat-model")) return;
    return buildThreatModel(ctx.isolation);
  });

  app.get("/api/v1/overview", async (req, reply) => {
    if (!adminOnly(req, reply, "overview")) return;
    const ping = await ctx.gateway.model.ping();
    const evals = BenchmarkEvaluator.list();
    return {
      service: { provider: ctx.gateway.model.provider, model: ctx.gateway.model.model, isMock: ctx.gateway.model.isMock, modelReachable: ping.ok, modelReason: ping.reason ?? null, blueFilterMode: env.BLUE_FILTER_MODE, ephemeralSecrets: env.GENERATED_SECRETS, labBusy: ctx.lab.busy },
      probes: ctx.isolation.latest(),
      evaluation: evals.find((e) => e.summary)?.summary ?? null,
      lastEvaluationStatus: evals[0] ? { id: evals[0].id, status: evals[0].status, error: evals[0].error } : null,
      sideChannel: SideChannelService.latestPerMode().map((s) => ({ ...s, samples: undefined })),
      audit: (({ isValid, brokenIndex, totalEvents, head, checkpointsValid }) => ({ isValid, brokenIndex, totalEvents, head, checkpointsValid }))(audit().verify()),
      anomalies: listAnomalies(8),
    };
  });
}
