import type { Agent } from "../models";

const agents: Agent[] = [];

export class AgentRepository {
  findAll(): Agent[] {
    return agents;
  }

  findById(id: string): Agent | null {
    return (
      agents.find((agent) => agent.id === id) ?? null
    );
  }

  create(agent: Agent): Agent {
    agents.push(agent);

    return agent;
  }

  update(
    id: string,
    data: Partial<Agent>,
  ): Agent | null {
    const agent = this.findById(id);

    if (!agent) {
      return null;
    }

    Object.assign(agent, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    return agent;
  }

  delete(id: string): boolean {
    const index = agents.findIndex(
      (agent) => agent.id === id,
    );

    if (index === -1) {
      return false;
    }

    agents.splice(index, 1);

    return true;
  }
}