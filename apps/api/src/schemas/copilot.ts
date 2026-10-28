import { z } from "zod";
import { failureSeveritySchema } from "./failure";

export const healthDimensionsSchema = z.object({
  correctness: z.number().min(0).max(100),
  safety: z.number().min(0).max(100),
  toolReliability: z.number().min(0).max(100),
  robustness: z.number().min(0).max(100),
  regressionStability: z.number().min(0).max(100),
});

export const copilotIssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: failureSeveritySchema,
  category: z.string(),
  description: z.string(),
  impact: z.string(),
  affectedScenarios: z.array(z.string()),
});

export const copilotRecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  action: z.string(),
  rationale: z.string(),
  actionType: z.enum(["generate_tests", "run_regression", "view_failures", "fix_agent"]),
});

export const copilotAnalysisSchema = z.object({
  agentId: z.string().nullable(),
  agentName: z.string().nullable(),
  summary: z.string(),
  healthStatus: z.enum(["excellent", "good", "degraded", "critical"]),
  healthScore: z.number().min(0).max(100),
  dimensions: healthDimensionsSchema,
  changeDescription: z.string(),
  topIssues: z.array(copilotIssueSchema),
  rootCauses: z.array(z.string()),
  recommendations: z.array(copilotRecommendationSchema),
  suggestedTests: z.array(z.string()),
  nextActions: z.array(z.string()),
  isAiGenerated: z.boolean(),
  generatedAt: z.string(),
});
