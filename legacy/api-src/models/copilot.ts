import type { FailureSeverity } from "./failure";
import type { HealthDimensions } from "./health";

export type CopilotIssue = {
  id: string;
  title: string;
  severity: FailureSeverity;
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
