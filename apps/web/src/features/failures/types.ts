export type FailureSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type FailureStatus =
  | "open"
  | "resolved"
  | "ignored";

export type Failure = {
  id: string;
  runId: string;
  scenarioId: string;
  type: string;
  severity: FailureSeverity;
  status: FailureStatus;
  title: string;
  description: string;
  expectedBehavior: string[];
  actualBehavior: string[];
  evidence: unknown[];
  deterministic: boolean;
  evaluator: string;
  createdAt: string;
  resolvedAt: string | null;
};

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