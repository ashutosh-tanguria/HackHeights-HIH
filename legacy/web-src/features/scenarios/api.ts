import { apiClient } from "@/lib/api-client";
import type { Scenario } from "./types";

export async function getScenarios() {
  return apiClient.get<Scenario[]>("/scenarios");
}

export async function getScenario(
  scenarioId: string,
) {
  return apiClient.get<Scenario>(
    `/scenarios/${scenarioId}`,
  );
}

export async function createScenario(
  data: Omit<
    Scenario,
    "id" | "status" | "createdAt" | "updatedAt"
  >,
) {
  return apiClient.post<Scenario>(
    "/scenarios",
    data,
  );
}

export async function updateScenario(
  scenarioId: string,
  data: Partial<Scenario>,
) {
  return apiClient.put<Scenario>(
    `/scenarios/${scenarioId}`,
    data,
  );
}

export async function deleteScenario(
  scenarioId: string,
) {
  return apiClient.delete<{ success: boolean }>(
    `/scenarios/${scenarioId}`,
  );
}

export async function generateAdversarialTests(
  scenarioId: string,
  options?: {
    count?: number;
    difficulty?: string;
    categories?: string[];
    focus?: string;
  },
) {
  return apiClient.post<{
    scenarios: Scenario[];
    count: number;
    sourceScenarioId: string;
  }>(`/scenarios/${scenarioId}/generate-tests`, options ?? {});
}

export async function batchCreateScenarios(
  scenarios: Array<Omit<Scenario, "id" | "status" | "createdAt" | "updatedAt">>,
) {
  return apiClient.post<{
    created: Scenario[];
    count: number;
  }>("/scenarios/batch-create", { scenarios });
}