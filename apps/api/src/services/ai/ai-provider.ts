import { z } from "zod";
import { env } from "../../config/env";
import { OpenAIProvider } from "./openai-provider";

export interface AIProvider {
  readonly name: string;
  isAvailable(): boolean;
  generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    systemPrompt?: string,
  ): Promise<T | null>;
  generateText(
    prompt: string,
    systemPrompt?: string,
  ): Promise<string | null>;
}

let defaultProviderInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!defaultProviderInstance) {
    defaultProviderInstance = new OpenAIProvider({
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_EVALUATION_MODEL,
    });
  }
  return defaultProviderInstance;
}

export function resetAIProvider(provider?: AIProvider): void {
  defaultProviderInstance = provider ?? null;
}
