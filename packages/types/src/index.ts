// Agent domain types
export type AgentIntegration = "http" | "openai" | "custom";
export type AgentStatus = "active" | "inactive" | "draft";

export type Agent = {
  id: string;
  name: string;
  description: string;
  integration: AgentIntegration;
  endpoint: string | null;
  model: string | null;
  status: AgentStatus;
  reliabilityScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  createdAt: string;
  updatedAt: string;
};

// Scenario domain types
export type ScenarioCategory =
  | "customer_support"
  | "security"
  | "tool_usage"
  | "reasoning"
  | "safety"
  | "general";

export type ScenarioDifficulty = "easy" | "medium" | "hard" | "critical";
export type ScenarioStatus = "draft" | "active" | "archived";

export type ToolStep = {
  tool: string;
  input: Record<string, unknown>;
  expectedOutput?: Record<string, unknown>;
};

export type Scenario = {
  id: string;
  title: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  status: ScenarioStatus;
  userInput: string;
  expectedBehavior: string[];
  forbiddenBehavior: string[];
  successCriteria: string[];
  toolSteps: ToolStep[];
  createdAt: string;
  updatedAt: string;
};

// Test Run & Result types
export type TestRunStatus = "pending" | "running" | "completed" | "failed";

export type TestRun = {
  id: string;
  agentId: string;
  suiteId: string;
  status: TestRunStatus;
  reliabilityScore: number | null;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  durationMs: number | null;
  traceId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type TestResultStatus = "passed" | "failed" | "skipped";

export type TestResult = {
  id: string;
  runId: string;
  scenarioId: string;
  status: TestResultStatus;
  score: number | null;
  expectedBehavior: string[];
  actualBehavior: string[];
  failureId: string | null;
  durationMs: number | null;
  createdAt: string;
};

// Failure domain types
export type FailureType =
  | "tool_misuse"
  | "tool_loop"
  | "hallucinated_success"
  | "unsafe_action"
  | "prompt_injection"
  | "semantic_mismatch";

export type FailureSeverity = "low" | "medium" | "high" | "critical";
export type FailureStatus = "open" | "resolved" | "ignored";
export type FailureEvaluator = "rule" | "llm" | "hybrid";

export type Failure = {
  id: string;
  runId: string;
  scenarioId: string;
  type: FailureType;
  severity: FailureSeverity;
  status: FailureStatus;
  title: string;
  description: string;
  expectedBehavior: string[];
  actualBehavior: string[];
  evidence: string[];
  deterministic: boolean;
  evaluator: FailureEvaluator;
  createdAt: string;
  resolvedAt: string | null;
};

// Trace domain types
export type TraceEventType = "agent_call" | "tool_call" | "evaluation";

export type TraceEvent = {
  id: string;
  type: TraceEventType;
  name: string;
  timestamp: string;
  durationMs?: number;
  input?: unknown;
  output?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
};

export type ExecutionTrace = {
  id: string;
  scenarioId: string;
  startedAt: string;
  completedAt: string;
  events: TraceEvent[];
  summary: {
    passed: boolean;
    score: number;
    failures: Array<{
      type: FailureType;
      severity: FailureSeverity;
      title: string;
      description: string;
    }>;
  };
};

// Reliability & Regression domain types
export type ReliabilityOverview = {
  reliabilityScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalAgents: number;
  activeAgents: number;
};

export type RegressionResult = {
  isRegression: boolean;
  baselineScore: number;
  currentScore: number;
  delta: number;
  newFailures: Failure[];
  resolvedFailures: Failure[];
};

// Failure Diagnosis types
export type FailureDiagnosis = {
  id: string;
  failureId: string;
  runId: string;
  summary: string;
  rootCause: string;
  category: string;
  severity: FailureSeverity;
  confidence: number;
  affectedCriteria: string[];
  evidence: string[];
  executionStep: string;
  recommendation: string;
  suggestedTests: string[];
  generatedAt: string;
  isAiGenerated: boolean;
};

// Adversarial Generation types
export type AdversarialAttackCategory =
  | "ambiguity"
  | "missing_information"
  | "prompt_injection"
  | "safety_boundary"
  | "tool_misuse"
  | "hallucination"
  | "policy_conflict"
  | "social_pressure";

export type AdversarialGenerationOptions = {
  scenarioId: string;
  count?: number;
  difficulty?: ScenarioDifficulty | "mixed";
  categories?: AdversarialAttackCategory[];
  focus?: string;
};

export type GeneratedScenario = Scenario & {
  isGenerated: boolean;
  sourceScenarioId: string;
  generationCategory: AdversarialAttackCategory;
  generationModel: string;
  generationTimestamp: string;
};

// Batch Test Run types
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
  failures: Failure[];
  diagnoses?: FailureDiagnosis[];
  createdAt: string;
};

// Multi-dimensional Health & Copilot types
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

// Enhanced Regression Intelligence
export type RegressionDimensionDelta = {
  dimension: string;
  baseline: number;
  current: number;
  delta: number;
};

export type EnhancedRegressionResult = {
  baselineRunId: string;
  currentRunId: string;
  isRegression: boolean;
  baselineScore: number;
  currentScore: number;
  delta: number;
  dimensionDeltas: {
    correctness: RegressionDimensionDelta;
    safety: RegressionDimensionDelta;
    toolUsage: RegressionDimensionDelta;
    latency: {
      baselineMs: number;
      currentMs: number;
      deltaMs: number;
      deltaPercent: number;
    };
  };
  newFailures: Failure[];
  resolvedFailures: Failure[];
  affectedScenarios: string[];
  likelyRegressionSource: string | null;
  explanation: string;
};

