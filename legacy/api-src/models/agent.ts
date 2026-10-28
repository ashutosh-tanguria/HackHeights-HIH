export type AgentStatus =
  | "active"
  | "inactive"
  | "error"
  | "not_configured";

export type AgentIntegration =
  | "http"
  | "openai"
  | "custom";

export type Agent = {
  id: string;
  name: string;
  description: string;
  integration: AgentIntegration;
  endpoint: string | null;
  model: string | null;
  status: AgentStatus;
  reliabilityScore: number | null;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  createdAt: string;
  updatedAt: string;
};