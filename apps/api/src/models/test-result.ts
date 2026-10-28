export type TestResultStatus =
  | "passed"
  | "failed"
  | "skipped";

export type TestResult = {
  id: string;
  runId: string;
  scenarioId: string;
  status: TestResultStatus;
  score: number;
  expectedBehavior: string[];
  actualBehavior: string[];
  failureId: string | null;
  durationMs: number;
  createdAt: string;
};