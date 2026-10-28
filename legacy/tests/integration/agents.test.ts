import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { AgentRepository } from "../../apps/api/src/repositories/agent-repository";
import { AgentService } from "../../apps/api/src/services/agent/agent-service";

describe("Agent Management Integration Tests", () => {
  test("creates, retrieves, updates, and deletes an agent", () => {
    const repository = new AgentRepository();
    const service = new AgentService(repository);

    // 1. Create
    const agent = service.create({
      name: "Test Support Agent",
      description: "Handles customer support queries",
      integration: "http",
      endpoint: "http://127.0.0.1:5000/mock-agent",
      status: "active",
    });

    assert.ok(agent.id, "Agent should have an ID");
    assert.equal(agent.name, "Test Support Agent");
    assert.equal(agent.integration, "http");
    assert.equal(agent.status, "active");
    assert.equal(agent.reliabilityScore, null);

    // 2. Retrieve by ID
    const retrieved = service.findById(agent.id);
    assert.ok(retrieved, "Agent should be retrievable by ID");
    assert.equal(retrieved?.name, "Test Support Agent");

    // 3. List all
    const allAgents = service.findAll();
    assert.equal(allAgents.length, 1);
    assert.equal(allAgents[0].id, agent.id);

    // 4. Update
    const updated = service.update(agent.id, {
      name: "Updated Support Agent",
      description: "Updated description",
    });
    assert.equal(updated?.name, "Updated Support Agent");
    assert.equal(updated?.description, "Updated description");

    // 5. Delete
    const deleted = service.delete(agent.id);
    assert.equal(deleted, true);
    assert.equal(service.findById(agent.id), null);
    assert.equal(service.findAll().length, 0);
  });
});
