import { z } from "zod";

export const agentIntegrationSchema = z.enum([
  "http",
  "openai",
  "custom",
]);

export const agentStatusSchema = z.enum([
  "active",
  "inactive",
  "error",
  "not_configured",
]);

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).default(""),
  integration: agentIntegrationSchema,
  endpoint: z.string().url().nullable().optional(),
  model: z.string().max(100).nullable().optional(),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  integration: agentIntegrationSchema.optional(),
  endpoint: z.string().url().nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  status: agentStatusSchema.optional(),
});

export type CreateAgentInput = z.infer<
  typeof createAgentSchema
>;

export type UpdateAgentInput = z.infer<
  typeof updateAgentSchema
>;