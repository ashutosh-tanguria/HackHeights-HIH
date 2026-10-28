export type ReliabilityTrendPoint = {
  runId: string;
  score: number;
  status:
    | "queued"
    | "running"
    | "completed"
    | "failed"
    | "cancelled";
  createdAt: string;
};

export type ReliabilityOverview = {
  reliabilityScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalAgents: number;
  activeAgents: number;
};

export type AgentReliabilityRun = {
  id: string;
  score: number | null;
  status:
    | "queued"
    | "running"
    | "completed"
    | "failed"
    | "cancelled";
  passedTests: number;
  failedTests: number;
  createdAt: string;
};

export type AgentReliability = {
  agentId: string;
  reliabilityScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  runs: AgentReliabilityRun[];
};