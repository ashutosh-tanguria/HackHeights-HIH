import type { TestResult } from "./test-result";
import type { Failure } from "./failure";
import type { FailureDiagnosis } from "./diagnosis";

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
