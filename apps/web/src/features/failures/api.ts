import { apiClient } from "@/lib/api-client";
import type { Failure, FailureDiagnosis } from "./types";

export async function getFailures() {
  return apiClient.get<Failure[]>(
    "/failures",
  );
}

export async function getFailure(
  failureId: string,
) {
  return apiClient.get<Failure>(
    `/failures/${failureId}`,
  );
}

export async function getRunFailures(
  runId: string,
) {
  return apiClient.get<Failure[]>(
    `/test-runs/${runId}/failures`,
  );
}

export async function updateFailure(
  failureId: string,
  status:
    | "open"
    | "resolved"
    | "ignored",
) {
  return apiClient.patch<Failure>(
    `/failures/${failureId}`,
    { status },
  );
}

export async function getFailureDiagnosis(failureId: string) {
  return apiClient.get<FailureDiagnosis>(
    `/failures/${failureId}/diagnosis`,
  );
}

export async function triggerFailureDiagnosis(failureId: string) {
  return apiClient.post<FailureDiagnosis>(
    `/failures/${failureId}/diagnose`,
  );
}