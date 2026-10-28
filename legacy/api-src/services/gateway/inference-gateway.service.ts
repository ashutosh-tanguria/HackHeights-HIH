import { createHmac } from "crypto";
import {
  createModelAdapter,
  type ModelAdapter,
  type ModelGenerateRequest,
  type ModelGenerateResponse,
  type ModelMessage,
} from "../../adapters/models";
import { RequestBalancer } from "./request-balancer";
import type { GatewayClient } from "../../middleware/gateway-auth";

export interface GenerateApiInput {
  prompt: string;
  model?: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  tenant?: "red" | "blue" | "admin";
  capability?: string;
  evaluationId?: string;
}

export interface OpenAIChatCompletionInput {
  model?: string;
  messages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    name?: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string[];
  tenant?: "red" | "blue" | "admin";
  capability?: string;
  evaluationId?: string;
}

export class InferenceGatewayService {
  private balancer: RequestBalancer;
  private primaryAdapter: ModelAdapter;
  private totalRequestsServed = 0;
  private totalTokensServed = 0;
  private averageLatencyMs = 0;
  private secretKey: string;

  constructor(customAdapter?: ModelAdapter, secretKey?: string) {
    this.primaryAdapter = customAdapter ?? createModelAdapter();
    this.balancer = new RequestBalancer("primary-fallback");
    this.secretKey = secretKey || process.env.BAYORA_TOKEN_SECRET || "bayora-inference-salt-secret-key-2026";

    this.balancer.addMember({
      id: "primary-adapter",
      name: `Primary (${this.primaryAdapter.name})`,
      adapter: this.primaryAdapter,
    });
  }

  getPrimaryAdapter(): ModelAdapter {
    return this.primaryAdapter;
  }

  setPrimaryAdapter(adapter: ModelAdapter) {
    this.primaryAdapter = adapter;
    this.balancer = new RequestBalancer("primary-fallback");
    this.balancer.addMember({
      id: "primary-adapter",
      name: `Primary (${adapter.name})`,
      adapter,
    });
  }

  public getStableCacheSalt(tenant: string, evaluationId: string = "default"): string {
    return createHmac("sha256", this.secretKey)
      .update(`${tenant}:${evaluationId}`)
      .digest("hex")
      .slice(0, 32);
  }

  private generateTenantCacheSalt(tenant?: string, evaluationId?: string): string {
    return this.getStableCacheSalt(tenant || "standard", evaluationId || "default");
  }

  async generate(
    input: GenerateApiInput,
    client?: GatewayClient,
  ): Promise<ModelGenerateResponse> {
    const startedAt = Date.now();
    const effectiveTenant = (client?.tenant === "admin" ? input.tenant : client?.tenant) || input.tenant || "standard";
    const cacheSalt = this.generateTenantCacheSalt(effectiveTenant, input.evaluationId);

    const modelRequest: ModelGenerateRequest = {
      prompt: input.prompt,
      system: input.system,
      model: input.model,
      temperature: input.temperature,
      max_tokens: input.max_tokens,
      top_p: input.top_p,
      tenant: effectiveTenant as any,
      capability: input.capability ?? "model.inference",
      cacheSalt,
    };

    const response = await this.balancer.executeWithBalancing(modelRequest);
    this.updateStats(response);
    return response;
  }

  async chatCompletions(
    input: OpenAIChatCompletionInput,
    client?: GatewayClient,
  ): Promise<ModelGenerateResponse> {
    const startedAt = Date.now();
    const effectiveTenant = (client?.tenant === "admin" ? input.tenant : client?.tenant) || input.tenant || "standard";
    const cacheSalt = this.generateTenantCacheSalt(effectiveTenant, input.evaluationId);

    const modelRequest: ModelGenerateRequest = {
      messages: input.messages,
      model: input.model,
      temperature: input.temperature,
      max_tokens: input.max_tokens,
      top_p: input.top_p,
      stream: input.stream,
      stop: input.stop,
      tenant: effectiveTenant as any,
      capability: input.capability ?? "model.inference",
      cacheSalt,
    };

    const response = await this.balancer.executeWithBalancing(modelRequest);
    this.updateStats(response);
    return response;
  }

  getAvailableModels() {
    return [
      {
        id: "qwen2.5:7b",
        object: "model",
        created: 1718000000,
        owned_by: "alibaba-qwen",
      },
      {
        id: "gpt-4o-mini",
        object: "model",
        created: 1718000000,
        owned_by: "openai",
      },
      {
        id: "bayora-target-model",
        object: "model",
        created: 1718000000,
        owned_by: "bayora-security",
      },
    ];
  }

  private updateStats(res: ModelGenerateResponse) {
    this.totalRequestsServed++;
    this.totalTokensServed += res.usage.total_tokens;
    this.averageLatencyMs =
      this.averageLatencyMs === 0
        ? res.durationMs
        : Math.round((this.averageLatencyMs * 0.8) + (res.durationMs * 0.2));
  }

  getStats() {
    return {
      status: "healthy",
      adapter: this.primaryAdapter.name,
      totalRequestsServed: this.totalRequestsServed,
      totalTokensServed: this.totalTokensServed,
      averageLatencyMs: this.averageLatencyMs,
      pool: this.balancer.getPoolStats(),
    };
  }
}

export const inferenceGatewayService = new InferenceGatewayService();
