import { apiClient } from "@/lib/api-client";
import type {
  ExecutionTrace,
  TestResult,
  TestRun,
} from "./types";
import type { Failure } from "../failures/types";

export async function getTestRuns() {
  return apiClient.get<TestRun[]>(
    "/test-runs",
  );
}

export async function getTestRun(
  runId: string,
) {
  return apiClient.get<TestRun>(
    `/test-runs/${runId}`,
  );
}

export async function createTestRun(
  data: {
    agentId: string;
    suiteId: string;
  },
) {
  return apiClient.post<{
    testRun: TestRun;
    evaluation: {
      passed: boolean;
      score: number;
    };
    failures: Failure[];
    trace: ExecutionTrace;
  }>("/test-runs", data);
}

export async function getTestRunResults(
  runId: string,
) {
  return apiClient.get<TestResult[]>(
    `/test-runs/${runId}/results`,
  );
}

export async function getTestRunFailures(
  runId: string,
) {
  return apiClient.get<Failure[]>(
    `/test-runs/${runId}/failures`,
  );
}

export async function getTestRunTrace(
  runId: string,
  traceId: string | null,
) {
  if (!traceId) {
    return null;
  }

  return apiClient.get<ExecutionTrace>(
    `/traces/${traceId}`,
  );
}

export async function createBatchRun(data: {
  agentId: string;
  scenarioIds: string[];
}) {
  return apiClient.post<import("./types").BatchTestRunResult>(
    "/test-runs/batch",
    data,
  );
}