import type { FailureSeverity } from "./failure";

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
