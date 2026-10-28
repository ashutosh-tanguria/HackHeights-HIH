import {
  AgentRepository,
} from "../../repositories";
import type { Agent } from "../../models";
import type { CreateAgentInput } from "../../schemas";

export class AgentService {
  constructor(
    private readonly agentRepository: AgentRepository,
  ) {}

  findAll(): Agent[] {
    return this.agentRepository.findAll();
  }

  findById(id: string): Agent | null {
    return this.agentRepository.findById(id);
  }

  create(input: CreateAgentInput): Agent {
    const now = new Date().toISOString();

    const agent: Agent = {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      integration: input.integration,
      endpoint: input.endpoint ?? null,
      model: input.model ?? null,
      status: input.endpoint
        ? "active"
        : "not_configured",
      reliabilityScore: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      createdAt: now,
      updatedAt: now,
    };

    return this.agentRepository.create(agent);
  }

  update(
    id: string,
    data: Partial<Agent>,
  ): Agent | null {
    return this.agentRepository.update(id, data);
  }

  delete(id: string): boolean {
    return this.agentRepository.delete(id);
  }
}