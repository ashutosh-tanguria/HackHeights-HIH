export type AgentExecutionRequest = {
  agent: {
    id: string;
    name: string;
    integration: "http" | "openai" | "custom";
    endpoint?: string | null;
    model?: string | null;
  };
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
  execute(request: AgentExecutionRequest): Promise<AgentExecutionResponse>;
}
