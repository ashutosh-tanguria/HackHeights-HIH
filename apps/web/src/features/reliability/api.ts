import { apiClient } from "@/lib/api-client";
import type {
  AgentReliability,
  ReliabilityOverview,
} from "./types";

export * from "./types";

export async function getReliabilityOverview() {
  return apiClient.get<ReliabilityOverview>(
    "/reliability",
  );
}

export async function getAgentReliability(
  agentId: string,
) {
  return apiClient.get<AgentReliability>(
    `/reliability/${agentId}`,
  );
}