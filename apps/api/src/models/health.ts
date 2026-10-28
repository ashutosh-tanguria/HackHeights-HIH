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
