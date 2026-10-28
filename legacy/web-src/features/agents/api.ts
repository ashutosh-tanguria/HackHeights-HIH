import { apiClient } from "@/lib/api-client";
import type { Agent } from "./types";

export async function getAgents() {
  return apiClient.get<Agent[]>("/agents");
}

export async function getAgent(agentId: string) {
  return apiClient.get<Agent>(`/agents/${agentId}`);
}

export async function createAgent(
  data: Omit<
    Agent,
    | "id"
    | "status"
    | "reliabilityScore"
    | "totalTests"
    | "passedTests"
    | "failedTests"
    | "createdAt"
    | "updatedAt"
  >,
) {
  return apiClient.post<Agent>("/agents", data);
}

export async function updateAgent(
  agentId: string,
  data: Partial<Agent>,
) {
  return apiClient.put<Agent>(`/agents/${agentId}`, data);
}

export async function deleteAgent(agentId: string) {
  return apiClient.delete<{ success: boolean }>(
    `/agents/${agentId}`,
  );
}