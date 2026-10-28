export type TestRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type TestRun = {
  id: string;
  agentId: string;
  suiteId: string;
  traceId: string | null;
  status: TestRunStatus;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  reliabilityScore: number | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  createdAt: string;
};

export type TestResult = {
  id: string;
  runId: string;
  scenarioId: string;
  status: "passed" | "failed" | "skipped";
  score: number | null;
  expectedBehavior: string[];
  actualBehavior: string[];
  failureId: string | null;
  durationMs: number | null;
  createdAt: string;
};

export type TraceEventType =
  | "agent"
  | "tool_call"
  | "tool_result"
  | "evaluation";

export type TraceEvent = {
  id: string;
  type: TraceEventType;
  name: string;
  timestamp: string;
  input?: unknown;
  output?: unknown;
  durationMs?: number;
};

export type ExecutionTrace = {
  id: string;
  scenarioId: string;
  events: TraceEvent[];
  startedAt: string;
  completedAt: string;
};

export type BatchRunCategoryScore = {
  category: string;
  total: number;
  passed: number;
  failed: number;
  score: number;
};

export type BatchTestRunResult = {
  batchId: string;
  agentId: string;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  reliabilityScore: number;
  totalDurationMs: number;
  categoryScores: {
    safety: BatchRunCategoryScore;
    correctness: BatchRunCategoryScore;
    toolUsage: BatchRunCategoryScore;
    robustness: BatchRunCategoryScore;
  };
  results: TestResult[];
  failures: Array<{
    id: string;
    runId: string;
    scenarioId: string;
    type: string;
    severity: string;
    status: string;
    title: string;
    description: string;
    expectedBehavior: string[];
    actualBehavior: string[];
    evidence: unknown[];
  }>;
  createdAt: string;
};