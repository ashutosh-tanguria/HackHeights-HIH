import { z } from "zod";
import { createScenarioSchema } from "./scenario";

export const adversarialAttackCategorySchema = z.enum([
  "ambiguity",
  "missing_information",
  "prompt_injection",
  "safety_boundary",
  "tool_misuse",
  "hallucination",
  "policy_conflict",
  "social_pressure",
]);

export const generateAdversarialTestsSchema = z.object({
  scenarioId: z.string().min(1),
  count: z.number().min(1).max(20).default(5),
  difficulty: z.enum(["easy", "medium", "hard", "critical", "mixed"]).default("mixed"),
  categories: z.array(adversarialAttackCategorySchema).min(1).default(["ambiguity", "missing_information", "safety_boundary"]),
  focus: z.string().optional(),
});

export const batchCreateScenariosSchema = z.object({
  scenarios: z.array(createScenarioSchema).min(1),
});
