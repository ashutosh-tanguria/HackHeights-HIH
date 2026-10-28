export type HealthDimensions = {
  correctness: number;
  safety: number;
  toolReliability: number;
  robustness: number;
  regressionStability: number;
};

export type AgentHealthScore = {
  agentId: string | null;
  overallScore: number;
  status: "excellent" | "good" | "degraded" | "critical";
  dimensions: HealthDimensions;
  totalEvaluations: number;
  recentRegressions: number;
  calculatedAt: string;
};

export type CopilotIssue = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  description: string;
  impact: string;
  affectedScenarios: string[];
};

export type CopilotRecommendation = {
  id: string;
  title: string;
  action: string;
  rationale: string;
  actionType: "generate_tests" | "run_regression" | "view_failures" | "fix_agent";
};

export type CopilotAnalysis = {
  agentId: string | null;
  agentName: string | null;
  summary: string;
  healthStatus: "excellent" | "good" | "degraded" | "critical";
  healthScore: number;
  dimensions: HealthDimensions;
  changeDescription: string;
  topIssues: CopilotIssue[];
  rootCauses: string[];
  recommendations: CopilotRecommendation[];
  suggestedTests: string[];
  nextActions: string[];
  isAiGenerated: boolean;
  generatedAt: string;
};
