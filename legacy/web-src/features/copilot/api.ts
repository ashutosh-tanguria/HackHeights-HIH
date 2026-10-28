import { apiClient } from "@/lib/api-client";
import type { AgentHealthScore, CopilotAnalysis } from "./types";

export async function getGlobalCopilotAnalysis() {
  return apiClient.get<CopilotAnalysis>("/copilot");
}

export async function getAgentCopilotAnalysis(agentId: string) {
  return apiClient.get<CopilotAnalysis>(`/copilot/${agentId}`);
}

export async function getHealthScore(agentId?: string) {
  const url = agentId ? `/health-score/${agentId}` : "/health-score";
  return apiClient.get<AgentHealthScore>(url);
}
