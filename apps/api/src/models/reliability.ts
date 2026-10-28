export type ReliabilityScore = {
  overall: number;
  passRate: number;
  failureRate: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  criticalFailures: number;
};

export type ReliabilityTrend = {
  timestamp: string;
  score: number;
  totalTests: number;
  failedTests: number;
};

export type ReliabilitySummary = {
  agentId: string;
  score: ReliabilityScore;
  trend: ReliabilityTrend[];
};