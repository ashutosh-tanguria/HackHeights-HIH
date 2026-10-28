import type { Agent } from "./types";

export function getAgentStatusLabel(status: Agent["status"]) {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "error":
      return "Error";
    case "not_configured":
      return "Not configured";
  }
}

export function getAgentReliabilityLabel(
  score: Agent["reliabilityScore"],
) {
  if (score === null) {
    return "--";
  }

  return `${Math.round(score)}%`;
}

export function getAgentTestSummary(agent: Agent) {
  return `${agent.passedTests}/${agent.totalTests} tests passed`;
}