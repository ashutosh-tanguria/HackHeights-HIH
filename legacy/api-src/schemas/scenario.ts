import { z } from "zod";

export const scenarioCategorySchema = z.enum([
  "basic_reliability",
  "tool_safety",
  "adversarial",
  "prompt_injection",
  "destructive_action",
]);

export const scenarioDifficultySchema = z.enum([
  "easy",
  "medium",
  "hard",
  "critical",
]);

export const scenarioToolStepSchema = z.object({
  tool: z.string().min(1),
  input: z.record(z.string(), z.unknown()),
});

export const scenarioStatusSchema = z.enum([
  "draft",
  "active",
  "archived",
]);

export const createScenarioSchema = z.object({
  title: z.string().min(1).max(200),
  category: scenarioCategorySchema,
  difficulty: scenarioDifficultySchema,
  userInput: z.string().min(1),
  expectedBehavior: z.array(z.string().min(1)),
  forbiddenBehavior: z.array(z.string().min(1)),
  successCriteria: z.array(z.string().min(1)),
  toolSteps: z.array(scenarioToolStepSchema).default([]),
});

export const updateScenarioSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: scenarioCategorySchema.optional(),
  difficulty: scenarioDifficultySchema.optional(),
  userInput: z.string().min(1).optional(),
  expectedBehavior: z.array(z.string().min(1)).optional(),
  forbiddenBehavior: z.array(z.string().min(1)).optional(),
  successCriteria: z.array(z.string().min(1)).optional(),
  toolSteps: z.array(scenarioToolStepSchema).optional(),
  status: scenarioStatusSchema.optional(),
});

export type CreateScenarioInput = z.infer<
  typeof createScenarioSchema
>;

export type UpdateScenarioInput = z.infer<
  typeof updateScenarioSchema
>;