import { apiClient } from "@/lib/api-client";
import type { RegressionResult } from "./types";

export * from "./types";

export async function compareRuns(
  baselineRunId: string,
  currentRunId: string,
) {
  const params = new URLSearchParams({
    baselineRunId,
    currentRunId,
  });

  return apiClient.get<RegressionResult>(
    `/regressions?${params.toString()}`,
  );
}