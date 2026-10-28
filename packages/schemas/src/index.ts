import { z } from "zod";

// Agent Schemas
export const agentIntegrationSchema = z.enum(["http", "openai", "custom"]);
export const agentStatusSchema = z.enum(["active", "inactive", "draft"]);

export const createAgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  integration: agentIntegrationSchema,
  endpoint: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  status: agentStatusSchema.default("active"),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  integration: agentIntegrationSchema.optional(),
  endpoint: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  status: agentStatusSchema.optional(),
});

// Scenario Schemas
export const scenarioCategorySchema = z.enum([
  "customer_support",
  "security",
  "tool_usage",
  "reasoning",
  "safety",
  "general",
]);

export const scenarioDifficultySchema = z.enum([
  "easy",
  "medium",
  "hard",
  "critical",
]);

export const scenarioStatusSchema = z.enum(["draft", "active", "archived"]);

export const toolStepSchema = z.object({
  tool: z.string().min(1),
  input: z.record(z.string(), z.unknown()),
  expectedOutput: z.record(z.string(), z.unknown()).optional(),
});

export const createScenarioSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: scenarioCategorySchema,
  difficulty: scenarioDifficultySchema,
  status: scenarioStatusSchema.default("active"),
  userInput: z.string().min(1),
  expectedBehavior: z.array(z.string().min(1)),
  forbiddenBehavior: z.array(z.string().min(1)).default([]),
  successCriteria: z.array(z.string().min(1)),
  toolSteps: z.array(toolStepSchema).default([]),
});

export const updateScenarioSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: scenarioCategorySchema.optional(),
  difficulty: scenarioDifficultySchema.optional(),
  status: scenarioStatusSchema.optional(),
  userInput: z.string().min(1).optional(),
  expectedBehavior: z.array(z.string().min(1)).optional(),
  forbiddenBehavior: z.array(z.string().min(1)).optional(),
  successCriteria: z.array(z.string().min(1)).optional(),
  toolSteps: z.array(toolStepSchema).optional(),
});

// Test Run Schemas
export const createTestRunSchema = z.object({
  agentId: z.string().min(1),
  suiteId: z.string().min(1),
});

// Failure Schemas
export const failureTypeSchema = z.enum([
  "tool_misuse",
  "tool_loop",
  "hallucinated_success",
  "unsafe_action",
  "prompt_injection",
  "semantic_mismatch",
]);

export const failureSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const failureStatusSchema = z.enum(["open", "resolved", "ignored"]);

export const updateFailureSchema = z.object({
  status: failureStatusSchema,
});

// Failure Diagnosis Schema
export const failureDiagnosisSchema = z.object({
  id: z.string(),
  failureId: z.string(),
  runId: z.string(),
  summary: z.string(),
  rootCause: z.string(),
  category: z.string(),
  severity: failureSeveritySchema,
  confidence: z.number().min(0).max(1),
  affectedCriteria: z.array(z.string()),
  evidence: z.array(z.string()),
  executionStep: z.string(),
  recommendation: z.string(),
  suggestedTests: z.array(z.string()),
  generatedAt: z.string(),
  isAiGenerated: z.boolean(),
});

// Adversarial Generation Schemas
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

// Batch Test Run Schemas
export const createBatchRunSchema = z.object({
  agentId: z.string().min(1),
  scenarioIds: z.array(z.string().min(1)).min(1),
});

// Copilot Schemas
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

