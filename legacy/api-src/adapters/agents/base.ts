import type {
  Agent,
  Scenario,
} from "../../models";

export type AgentExecutionRequest = {
  agent: Agent;
  scenario: Scenario;
  input: string;
};

export type AgentExecutionResponse = {
  success: boolean;
  statusCode: number | null;
  output: string;
  error: string | null;
  durationMs: number;
};

export interface AgentAdapter {
  execute(
    request: AgentExecutionRequest,
  ): Promise<AgentExecutionResponse>;
}