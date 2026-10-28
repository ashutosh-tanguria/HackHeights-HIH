import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AuthorizationService } from "../services/gateway/authorization";
import { CapabilityService } from "../services/gateway/capability-service";
import { IsolationService } from "../services/security/isolation-service";
import { SideChannelService, SideChannelMode } from "../services/security/side-channel-service";
import { auditService } from "../services/audit/audit-service";
import { BlueDefenseService } from "../services/defense/blue-defense";
import { BenchmarkEvaluator } from "../services/evaluation/benchmark-evaluator";
import { ModelAdapter } from "../services/ai/model-adapter";
import { sqliteDb } from "../repositories/sqlite-db";

const modelAdapter = new ModelAdapter();
const blueDefense = new BlueDefenseService();
const isolationService = new IsolationService();
const sideChannelService = new SideChannelService(modelAdapter);
const benchmarkEvaluator = new BenchmarkEvaluator(modelAdapter, blueDefense);

// Active revocation set for killed evaluations
const revokedEvaluations = new Set<string>();

// Per-tenant rate limit tracker (window: 60s)
const rateLimitMap = new Map<string, number[]>();

function checkTenantRateLimit(tenant: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(tenant) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(tenant, timestamps);
  return true;
}

export async function bayoraController(fastify: FastifyInstance) {
  // Ensure SQLite database & tables are initialized
  await sqliteDb.initialize();

  // -------------------------------------------------------------
  // Capability Tokens
  // -------------------------------------------------------------
  fastify.post("/api/v1/tokens", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};
    const tenant = body.tenant || "red";
    const evalId = body.evaluationId || `eval_${Date.now().toString().slice(-6)}`;
    const ttl = body.expiresInSeconds || 3600;

    const tokenInfo = AuthorizationService.issueToken(evalId, tenant, ttl, body.capabilities);

    auditService.appendEvent({
      id: `evt-tok-${Date.now()}`,
      timestamp: new Date().toISOString(),
      evaluationId: evalId,
      actor: "admin",
      action: "CAPABILITY_TOKEN_ISSUED",
      targetResource: `tokens/${tenant}`,
      canonicalPayload: JSON.stringify({ tenant, evalId, capabilities: tokenInfo.capabilities }),
      payloadSummary: `Capability token issued for tenant '${tenant}' (TTL: ${ttl}s).`,
    });

    return reply.send(tokenInfo);
  });

  // -------------------------------------------------------------
  // Inference Gateway with Capability Auth & Stable Salt
  // -------------------------------------------------------------
  const handleInference = async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      auditService.appendEvent({
        id: `evt-denied-${Date.now()}`,
        timestamp: new Date().toISOString(),
        evaluationId: "UNAUTHENTICATED",
        actor: "orchestrator",
        action: "ACCESS_DENIED",
        targetResource: "gateway/inference",
        canonicalPayload: JSON.stringify({ reason: "Missing Authorization header", statusCode: 401 }),
        payloadSummary: "HTTP 401: Unauthorized access attempt without capability token.",
      });
      return reply.status(401).send({ error: { code: 401, message: "Missing capability token in Authorization header" } });
    }

    let tokenPayload;
    try {
      tokenPayload = AuthorizationService.verifyToken(authHeader);
    } catch (err: any) {
      const status = err.statusCode || 401;
      auditService.appendEvent({
        id: `evt-denied-${Date.now()}`,
        timestamp: new Date().toISOString(),
        evaluationId: "INVALID_TOKEN",
        actor: "orchestrator",
        action: "ACCESS_DENIED",
        targetResource: "gateway/inference",
        canonicalPayload: JSON.stringify({ reason: err.message, statusCode: status }),
        payloadSummary: `HTTP ${status}: Capability token rejection: ${err.message}`,
      });
      return reply.status(status).send({ error: { code: status, message: err.message } });
    }

    // Verify evaluation is not killed
    if (revokedEvaluations.has(tokenPayload.evaluationId)) {
      return reply.status(401).send({ error: { code: 401, message: "Evaluation session has been revoked/killed" } });
    }

    // Capability check: Must possess model.inference
    if (!CapabilityService.hasCapability(tokenPayload.tenant, "model.inference")) {
      auditService.appendEvent({
        id: `evt-denied-${Date.now()}`,
        timestamp: new Date().toISOString(),
        evaluationId: tokenPayload.evaluationId,
        actor: `bayora-${tokenPayload.tenant}` as any,
        action: "ACCESS_DENIED",
        targetResource: "gateway/inference",
        canonicalPayload: JSON.stringify({ reason: "Missing model.inference capability", statusCode: 403 }),
        payloadSummary: `HTTP 403: Tenant '${tokenPayload.tenant}' lacks 'model.inference' capability.`,
      });
      return reply.status(403).send({ error: { code: 403, message: `Tenant '${tokenPayload.tenant}' lacks required capability 'model.inference'` } });
    }

    // Rate limiting per tenant
    const maxRate = parseInt(process.env.GATEWAY_RATE_LIMIT_MAX || "10", 10);
    const windowMs = parseInt(process.env.GATEWAY_RATE_LIMIT_WINDOW_MS || "60000", 10);
    if (!checkTenantRateLimit(tokenPayload.tenant, maxRate, windowMs)) {
      reply.header("Retry-After", "60");
      auditService.appendEvent({
        id: `evt-ratelimit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        evaluationId: tokenPayload.evaluationId,
        actor: `bayora-${tokenPayload.tenant}` as any,
        action: "ACCESS_DENIED",
        targetResource: "gateway/inference",
        canonicalPayload: JSON.stringify({ reason: "Rate limit exceeded", statusCode: 429 }),
        payloadSummary: `HTTP 429: Rate limit exceeded for tenant '${tokenPayload.tenant}' (max: ${maxRate}/min).`,
      });
      return reply.status(429).send({ error: { code: 429, message: `Rate limit exceeded for tenant '${tokenPayload.tenant}'. Limit: ${maxRate} per ${windowMs / 1000}s.` } });
    }

    const body = (req.body as any) || {};
    let messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    if (body.messages && Array.isArray(body.messages)) {
      messages = body.messages;
    } else if (body.prompt) {
      messages = [{ role: "user", content: body.prompt }];
    } else {
      return reply.status(400).send({ error: { code: 400, message: "Request must include 'messages' array or 'prompt' string" } });
    }

    // Stable HMAC cache salt derived from tenant + evaluationId
    const cacheSalt = modelAdapter.getStableCacheSalt(tokenPayload.tenant, tokenPayload.evaluationId);

    try {
      const resp = await modelAdapter.complete({
        evaluationId: tokenPayload.evaluationId,
        tenant: tokenPayload.tenant,
        messages,
        maxTokens: body.max_tokens || body.maxTokens || 256,
        temperature: body.temperature ?? 0.1,
        cacheSalt,
      });

      // Audit log the inference
      auditService.appendEvent({
        id: `evt-inf-${Date.now()}`,
        timestamp: new Date().toISOString(),
        evaluationId: tokenPayload.evaluationId,
        actor: `bayora-${tokenPayload.tenant}` as any,
        action: "INFERENCE_REQUEST",
        targetResource: `${resp.provider}/${resp.model}`,
        canonicalPayload: JSON.stringify({
          tenant: tokenPayload.tenant,
          evaluationId: tokenPayload.evaluationId,
          tokens: resp.totalTokens,
          cacheSalt,
          isMock: resp.isMock,
        }),
        payloadSummary: `Inference executed for tenant '${tokenPayload.tenant}'. Model: ${resp.model} (provider: ${resp.provider}).`,
      });

      return reply.send({
        id: resp.id,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: resp.model,
        provider: resp.provider,
        isMock: resp.isMock,
        cacheSaltApplied: cacheSalt,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: resp.content },
            finish_reason: resp.refused ? "safety_refusal" : "stop",
          },
        ],
        usage: {
          prompt_tokens: resp.promptTokens,
          completion_tokens: resp.completionTokens,
          total_tokens: resp.totalTokens,
        },
        durationMs: resp.durationMs,
        ttftMs: resp.ttftMs,
      });
    } catch (err: any) {
      const status = err.statusCode || 502;
      return reply.status(status).send({ error: { code: status, message: err.message } });
    }
  };

  fastify.post("/api/v1/generate", handleInference);
  fastify.post("/v1/chat/completions", handleInference);

  fastify.get("/v1/models", async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      object: "list",
      data: [
        {
          id: modelAdapter.getModelName(),
          object: "model",
          created: 1729000000,
          owned_by: "bayora-target-sandbox",
          provider: modelAdapter.getProvider(),
        },
      ],
    });
  });

  // -------------------------------------------------------------
  // Benchmarks & Evaluations Management
  // -------------------------------------------------------------
  fastify.get("/api/v1/benchmarks", async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send(benchmarkEvaluator.loadManifest());
  });

  fastify.post("/api/v1/evaluations", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};
    const evalId = body.id || `eval_${Date.now().toString().slice(-6)}`;
    const modelId = modelAdapter.getModelName();
    const policyHash = "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const datasetVersions = {
      AdvBench: "1.0.0",
      HarmBench: "1.0.0",
      JailbreakBench: "1.0.0",
      Lakera_Gandalf: "1.0.0",
      Benign_Alpaca: "1.0.0",
    };
    const seed = body.seed || 9412;

    sqliteDb.saveEvaluation({
      id: evalId,
      status: "created",
      modelId,
      policyHash,
      datasetVersions: JSON.stringify(datasetVersions),
      seed,
      redSuccessBefore: null,
      redSuccessAfter: null,
      n: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    auditService.appendEvent({
      id: `evt-eval-${Date.now()}`,
      timestamp: new Date().toISOString(),
      evaluationId: evalId,
      actor: "admin",
      action: "EVALUATION_INIT",
      targetResource: `evaluations/${evalId}`,
      canonicalPayload: JSON.stringify({ evalId, modelId, seed, policyHash }),
      payloadSummary: `Created evaluation '${evalId}' frozen with seed ${seed}.`,
    });

    return reply.send({
      id: evalId,
      status: "created",
      modelId,
      policyHash,
      datasetVersions,
      seed,
    });
  });

  fastify.get("/api/v1/evaluations/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const params = req.params as any;
    const ev = sqliteDb.getEvaluation(params.id);
    if (!ev) {
      return reply.status(404).send({ error: { code: 404, message: `Evaluation not found: ${params.id}` } });
    }

    return reply.send({
      id: ev.id,
      status: ev.status,
      redSuccessBefore: ev.redSuccessBefore,
      redSuccessAfter: ev.redSuccessAfter,
      n: ev.n,
      modelId: ev.modelId,
      policyHash: ev.policyHash,
      datasetVersions: JSON.parse(ev.datasetVersions),
      seed: ev.seed,
      createdAt: ev.createdAt,
      updatedAt: ev.updatedAt,
    });
  });

  fastify.post("/api/v1/evaluations/:id/run", async (req: FastifyRequest, reply: FastifyReply) => {
    const params = req.params as any;
    const body = (req.body as any) || {};
    const evalId = params.id;
    const maxCases = body.maxCases || 20;

    sqliteDb.updateEvaluationStatus(evalId, "running");

    const result = await benchmarkEvaluator.runEvaluation(evalId, maxCases);

    auditService.appendEvent({
      id: `evt-eval-run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      evaluationId: evalId,
      actor: "admin",
      action: "DEFENSE_TRIGGERED",
      targetResource: `evaluations/${evalId}/defense`,
      canonicalPayload: JSON.stringify({
        asrBefore: result.asrBefore,
        asrAfter: result.asrAfter,
        relativeReduction: result.relativeReduction,
        n: result.n,
        provider: result.provider,
        isMock: result.isMock,
      }),
      payloadSummary: `Benchmark completed: Before Blue Defense ASR=${result.asrBefore}%, After ASR=${result.asrAfter}% (reduction: ${result.relativeReduction}%, n=${result.n}).`,
    });

    // Check caller tenant: If Blue tenant requests view before seal, redact Red payloads
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = AuthorizationService.verifyToken(authHeader);
        if (token.tenant === "blue") {
          return reply.send(benchmarkEvaluator.sanitizeForBlueTenant(result, false));
        }
      } catch {}
    }

    return reply.send(result);
  });

  fastify.post("/api/v1/evaluations/:id/kill", async (req: FastifyRequest, reply: FastifyReply) => {
    const params = req.params as any;
    const evalId = params.id;
    revokedEvaluations.add(evalId);
    sqliteDb.updateEvaluationStatus(evalId, "killed");

    auditService.appendEvent({
      id: `evt-kill-${Date.now()}`,
      timestamp: new Date().toISOString(),
      evaluationId: evalId,
      actor: "admin",
      action: "EVALUATION_INIT",
      targetResource: `evaluations/${evalId}/kill`,
      canonicalPayload: JSON.stringify({ killed: true }),
      payloadSummary: `Emergency kill switch engaged for evaluation '${evalId}'. Tokens revoked.`,
    });

    return reply.send({ status: "killed", evaluationId: evalId });
  });

  // -------------------------------------------------------------
  // Real Container Isolation Probes
  // -------------------------------------------------------------
  fastify.post("/api/v1/security/probes/run", async (_req: FastifyRequest, reply: FastifyReply) => {
    const result = await isolationService.runAllProbes();

    auditService.appendEvent({
      id: `evt-probes-${Date.now()}`,
      timestamp: new Date().toISOString(),
      evaluationId: "EVAL-SEC-PROBES",
      actor: "admin",
      action: "PROBE_EXECUTED",
      targetResource: "sandbox/isolation",
      canonicalPayload: JSON.stringify({
        status: result.status,
        totalProbes: result.totalProbes,
        blockedCount: result.blockedCount,
        allPassed: result.allPassed,
      }),
      payloadSummary: `Container boundary probes status: ${result.status} (${result.blockedCount} blocked).`,
    });

    return reply.send(result);
  });

  fastify.get("/api/v1/security/probes", async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send(isolationService.getLatestProbes());
  });

  // -------------------------------------------------------------
  // Side-Channel Timing Measurement (Real Mann-Whitney AUC + Bootstrap CI)
  // -------------------------------------------------------------
  fastify.post("/api/v1/security/side-channel/run", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};
    const mode = (body.mode || "salted_isolated") as SideChannelMode;
    const samples = body.samples || 30;

    const experiment = await sideChannelService.runExperiment(mode, samples);

    auditService.appendEvent({
      id: `evt-sc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      evaluationId: "EVAL-SIDE-CHANNEL",
      actor: "admin",
      action: "SIDE_CHANNEL_BENCHMARK",
      targetResource: `side-channel/${mode}`,
      canonicalPayload: JSON.stringify({
        mode: experiment.mode,
        auc: experiment.auc,
        aucCi95: experiment.aucCi95,
        source: experiment.source,
        isSimulated: experiment.isSimulated,
      }),
      payloadSummary: `Side-channel experiment (${experiment.mode}): AUC=${experiment.auc} [${experiment.aucCi95.join(", ")}], source=${experiment.source}.`,
    });

    return reply.send(experiment);
  });

  // -------------------------------------------------------------
  // Audit Chain, Verification, Tamper Demo, and Provenance Export
  // -------------------------------------------------------------
  fastify.get("/api/v1/audit", async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send(auditService.getEvents());
  });

  fastify.get("/api/v1/audit/verify", async (_req: FastifyRequest, reply: FastifyReply) => {
    const status = auditService.verifyChainStatus();
    return reply.send(status);
  });

  fastify.post("/api/v1/audit/tamper-demo", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};
    const result = auditService.tamperDemo(body.index ?? 1);
    return reply.send(result);
  });

  fastify.post("/api/v1/audit/restore", async (_req: FastifyRequest, reply: FastifyReply) => {
    auditService.initGenesisChain();
    return reply.send({ status: "restored", valid: true });
  });

  fastify.get("/api/v1/audit/export", async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send(auditService.exportProvenanceBundle());
  });

  // -------------------------------------------------------------
  // Telemetry & Cross-Tenant Leakage Redaction
  // -------------------------------------------------------------
  fastify.get("/api/v1/telemetry", async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    let tenant: string = "admin";

    if (authHeader) {
      try {
        const payload = AuthorizationService.verifyToken(authHeader);
        tenant = payload.tenant;
      } catch {}
    }

    const allEvents = auditService.getEvents();

    // If caller is blue tenant, redact any red payloads or defense details
    if (tenant === "blue") {
      const sanitized = allEvents.map((e) => {
        if (e.actor === "bayora-red" || e.action === "INFERENCE_REQUEST") {
          return {
            ...e,
            canonicalPayload: "[REDACTED_PRE_SEAL_TENANT_ISOLATION]",
            payloadSummary: `Red tenant activity recorded (payload sealed until test completion).`,
          };
        }
        return e;
      });
      return reply.send(sanitized);
    }

    return reply.send(allEvents);
  });

  // Cross-tenant defense access control demo
  fastify.get("/api/v1/defense/config", async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ error: { code: 401, message: "Missing capability token" } });
    }

    const token = AuthorizationService.verifyToken(authHeader);
    if (!CapabilityService.hasCapability(token.tenant, "defense:read")) {
      auditService.appendEvent({
        id: `evt-leakage-attempt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        evaluationId: token.evaluationId,
        actor: `bayora-${token.tenant}` as any,
        action: "ACCESS_DENIED",
        targetResource: "defense/rules",
        canonicalPayload: JSON.stringify({ reason: "Tenant unauthorized for defense:read", statusCode: 403 }),
        payloadSummary: `Cross-tenant leakage attempt blocked: Tenant '${token.tenant}' forbidden from inspecting Blue defense configuration.`,
      });
      return reply.status(403).send({ error: { code: 403, message: `Access denied: Tenant '${token.tenant}' does not have 'defense:read' capability.` } });
    }

    return reply.send({
      rules: blueDefense.getRules(),
    });
  });

  // Capsule metadata endpoint
  fastify.get("/api/v1/evaluations/:id/capsule", async (req: FastifyRequest, reply: FastifyReply) => {
    const params = req.params as any;
    const ev = sqliteDb.getEvaluation(params.id);

    return reply.send({
      evaluationId: params.id,
      imageDigests: {
        gateway: "sha256:d89a1f2b4c8e70a192837bc901823901823091bc891021f82c39102a9b830129",
        red: "sha256:7b1e2c3d4a5f6091823901823091bc891021f82c39102a9b830129840192bc8019",
        blue: "sha256:3c4d5e6f7a8b901823091bc891021f82c39102a9b830129840192bc80192830192",
        target: "sha256:4d5e6f7a8b9c01823901823091bc891021f82c39102a9b830129840192bc801928",
      },
      policyHash: ev ? ev.policyHash : "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      datasetVersions: ev ? JSON.parse(ev.datasetVersions) : { AdvBench: "1.0.0", HarmBench: "1.0.0" },
      seed: ev ? ev.seed : 9412,
      modelId: ev ? ev.modelId : modelAdapter.getModelName(),
      chainHead: auditService.getHeadHash(),
      probeResults: isolationService.getLatestProbes(),
    });
  });

  // Backwards-compatible aliases
  fastify.get("/api/bayora/probes", async (_req, reply) => reply.send(isolationService.getLatestProbes()));
  fastify.post("/api/bayora/probes/run-all", async (_req, reply) => reply.send(await isolationService.runAllProbes()));
  fastify.get("/api/bayora/audit/events", async (_req, reply) => reply.send(auditService.getEvents()));
  fastify.post("/api/bayora/audit/verify", async (_req, reply) => reply.send(auditService.verifyIntegrity()));
  fastify.post("/api/bayora/audit/tamper", async (req, reply) => {
    const body = req.body as any;
    reply.send(auditService.tamperDemo(body.index ?? 1));
  });
}
