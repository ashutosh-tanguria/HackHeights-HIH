import type { Agent } from "../../models";
import type { AgentAdapter } from "./base";
import { HttpAgentAdapter } from "./http";
import { OpenAIAgentAdapter } from "./openai";
import { CustomAgentAdapter } from "./custom";

export function createAgentAdapter(
  agent: Agent,
): AgentAdapter {
  switch (agent.integration) {
    case "http":
      return new HttpAgentAdapter();

    case "openai":
      return new OpenAIAgentAdapter();

    case "custom":
      return new CustomAgentAdapter();

    default:
      throw new Error(
        `Unsupported agent integration: ${agent.integration}`,
      );
  }
}