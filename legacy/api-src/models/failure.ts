export type FailureType =
  | "tool_misuse"
  | "tool_loop"
  | "hallucinated_success"
  | "unsafe_action"
  | "prompt_injection"
  | "semantic_mismatch";

export type FailureSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type FailureStatus =
  | "open"
  | "resolved"
  | "ignored";

export type FailureEvaluator =
  | "rule"
  | "llm"
  | "hybrid";

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