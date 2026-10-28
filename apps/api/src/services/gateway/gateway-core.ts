import { createHash } from "crypto";
import { env } from "../../config/env";
import { auditService } from "../audit/audit-service";
import { BlueClient, BlueUnavailableError } from "../defense/blue-client";
import { ChatMessage, ModelAdapter, ModelResponse, ProviderError, looksLikeRefusal } from "../model/model-adapter";
import { recordAnomaly } from "../security/anomalies";
import { Tenant, TokenClaims, cacheSalt } from "../security/tokens";

export class GatewayError extends Error {
  constructor(public statusCode: 400 | 401 | 403 | 429 | 502, message: string, public headers: Record<string, string> = {}) {
    super(message);
  }
}

/** Sliding-window request limiter + in-flight cap, both keyed by tenant. */
export class TenantLimiter {
  private stamps = new Map<string, number[]>();
  private inflight = new Map<string, number>();
  constructor(private max = env.RATE_LIMIT_MAX, private windowMs = env.RATE_LIMIT_WINDOW_MS, private cap = env.CONCURRENCY_CAP) {}

  /** Returns a release function, or throws GatewayError(429). */
  public acquire(tenant: string, now = Date.now()): () => void {
    const recent = (this.stamps.get(tenant) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      const retry = Math.ceil((this.windowMs - (now - recent[0])) / 1000);
      throw new GatewayError(429, `Rate limit exceeded for tenant '${tenant}' (${this.max} per ${this.windowMs / 1000}s)`, { "Retry-After": String(retry) });
    }
    const cur = this.inflight.get(tenant) ?? 0;
    if (cur >= this.cap) throw new GatewayError(429, `Concurrency cap reached for tenant '${tenant}' (${this.cap} in flight)`, { "Retry-After": "1" });
    recent.push(now);
    this.stamps.set(tenant, recent);
    this.inflight.set(tenant, cur + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.inflight.set(tenant, Math.max(0, (this.inflight.get(tenant) ?? 1) - 1));
    };
  }
}

export interface InferResult {
  response: ModelResponse | null;
  content: string;
  refused: boolean;
  blockedBy: "blue-input" | "blue-output" | null;
  blueRuleIds: string[];
  blueExecution: "container" | "in-process" | null;
  cacheSaltPrefix: string | null;
}

export type SaltMode = "tenant-salt" | "none";

/**
 * Single inference path. Every Red/Blue/admin request, the evaluator and the side-channel lab go through here,
 * so limits, salting and audit apply uniformly.
 */
export class GatewayCore {
  constructor(
    public readonly model = new ModelAdapter(),
    public readonly blue = new BlueClient(),
    public readonly limiter = new TenantLimiter(),
  ) {}

  public async infer(
    claims: Pick<TokenClaims, "tenant" | "evaluationId" | "blue">,
    messages: ChatMessage[],
    opts: { maxTokens?: number; temperature?: number; seed?: number; salt?: SaltMode; enforceLimits?: boolean; audit?: boolean } = {},
  ): Promise<InferResult> {
    const release = opts.enforceLimits === false ? () => {} : this.acquireOrAudit(claims);
    const salt = (opts.salt ?? "tenant-salt") === "tenant-salt" ? cacheSalt(claims.tenant, claims.evaluationId) : null;
    const promptText = messages.map((m) => m.content).join("\n");
    const promptSha = createHash("sha256").update(promptText).digest("hex");
    let blueExecution: InferResult["blueExecution"] = null;
    try {
      if (claims.blue) {
        const v = await this.blue.filter("input", promptText);
        blueExecution = v.execution;
        if (v.blocked) {
          this.audit(claims, "BLUE_BLOCK_INPUT", { promptSha256: promptSha, ruleIds: v.ruleIds, execution: v.execution }, `Blue input filter blocked a ${claims.tenant} request (rules: ${v.ruleIds.join(",")}).`, opts.audit);
          return { response: null, content: "[blocked by Blue input filter]", refused: true, blockedBy: "blue-input", blueRuleIds: v.ruleIds, blueExecution, cacheSaltPrefix: salt };
        }
      }
      const salted: ChatMessage[] = salt ? [{ role: "system", content: `[bayora-cache-salt:${salt}]` }, ...messages] : messages;
      let response: ModelResponse;
      try {
        response = await this.model.complete({ messages: salted, maxTokens: opts.maxTokens, temperature: opts.temperature, seed: opts.seed });
      } catch (e) {
        if (e instanceof ProviderError) {
          recordAnomaly({ kind: "PROVIDER_FAILURE", severity: "critical", tenant: claims.tenant, summary: "Target model backend failed; request answered with 502 (no mock fallback)." });
        }
        throw e;
      }
      if (claims.blue) {
        const v = await this.blue.filter("output", response.content);
        if (v.blocked) {
          this.audit(claims, "BLUE_BLOCK_OUTPUT", { promptSha256: promptSha, ruleIds: v.ruleIds, execution: v.execution }, `Blue output filter blocked a model reply for ${claims.tenant} (rules: ${v.ruleIds.join(",")}).`, opts.audit);
          return { response, content: "[blocked by Blue output filter]", refused: true, blockedBy: "blue-output", blueRuleIds: v.ruleIds, blueExecution, cacheSaltPrefix: salt };
        }
      }
      this.audit(
        claims,
        "INFERENCE",
        { promptSha256: promptSha, promptChars: promptText.length, provider: response.provider, model: response.model, isMock: response.isMock, ttftMs: Math.round(response.ttftMs), totalMs: Math.round(response.totalMs), saltApplied: !!salt, blue: claims.blue },
        `Inference for ${claims.tenant} via ${response.provider}/${response.model}${response.isMock ? " (MOCK)" : ""}.`,
        opts.audit,
      );
      return { response, content: response.content, refused: looksLikeRefusal(response.content), blockedBy: null, blueRuleIds: [], blueExecution, cacheSaltPrefix: salt };
    } catch (e) {
      if (e instanceof BlueUnavailableError) throw new GatewayError(502, e.message);
      if (e instanceof ProviderError) throw new GatewayError(502, e.message);
      throw e;
    } finally {
      release();
    }
  }

  private acquireOrAudit(claims: Pick<TokenClaims, "tenant" | "evaluationId">): () => void {
    try {
      return this.limiter.acquire(claims.tenant);
    } catch (e) {
      if (e instanceof GatewayError && e.statusCode === 429) {
        const ev = auditService().append({
          evaluationId: claims.evaluationId,
          actor: claims.tenant as Tenant,
          action: "ACCESS_DENIED",
          targetResource: "gateway/inference",
          payload: { statusCode: 429, reason: e.message },
          summary: `HTTP 429 for tenant '${claims.tenant}': ${e.message}`,
        });
        recordAnomaly({ kind: "RATE_LIMIT", severity: "warning", tenant: claims.tenant, summary: `Tenant '${claims.tenant}' hit a gateway limit (HTTP 429).`, auditIndex: ev.index });
      }
      throw e;
    }
  }

  private audit(claims: Pick<TokenClaims, "tenant" | "evaluationId">, action: string, payload: unknown, summary: string, enabled = true) {
    if (enabled === false) return;
    auditService().append({ evaluationId: claims.evaluationId, actor: claims.tenant as Tenant, action, targetResource: "gateway/inference", payload, summary });
  }
}
