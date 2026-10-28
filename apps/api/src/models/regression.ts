export type RegressionStatus =
  | "improved"
  | "stable"
  | "regressed"
  | "not_evaluated";

export type AgentVersion = {
  id: string;
  agentId: string;
  version: string;
  reliabilityScore: number | null;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  evaluatedAt: string | null;
};

export type RegressionResult = {
  id: string;
  agentId: string;
  previousVersionId: string;
  currentVersionId: string;
  previousScore: number | null;
  currentScore: number | null;
  scoreChange: number | null;
  status: RegressionStatus;
  newFailures: number;
  resolvedFailures: number;
  createdAt: string;
};