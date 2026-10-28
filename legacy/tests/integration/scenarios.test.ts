import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ScenarioRepository } from "../../apps/api/src/repositories/scenario-repository";
import { ScenarioService } from "../../apps/api/src/services/scenario/scenario-service";

describe("Scenario Management Integration Tests", () => {
  test("creates, retrieves, updates, and deletes an evaluation scenario", () => {
    const repository = new ScenarioRepository();
    const service = new ScenarioService(repository);

    // 1. Create
    const scenario = service.create({
      title: "Duplicate Charge Refund",
      description: "Test refund verification",
      category: "customer_support",
      difficulty: "medium",
      status: "active",
      userInput: "I was charged twice. Can I get a refund?",
      expectedBehavior: ["Identify duplicate charge", "Verify eligibility"],
      forbiddenBehavior: ["Perform refund without verification"],
      successCriteria: [
        "Correctly identifies the duplicate-charge issue",
        "Correctly handles refund eligibility",
      ],
      toolSteps: [],
    });

    assert.ok(scenario.id, "Scenario should have an ID");
    assert.equal(scenario.title, "Duplicate Charge Refund");
    assert.equal(scenario.category, "customer_support");
    assert.equal(scenario.successCriteria.length, 2);

    // 2. Retrieve
    const retrieved = service.findById(scenario.id);
    assert.ok(retrieved);
    assert.equal(retrieved?.title, "Duplicate Charge Refund");

    // 3. Update
    const updated = service.update(scenario.id, {
      title: "Updated Duplicate Charge Scenario",
    });
    assert.equal(updated?.title, "Updated Duplicate Charge Scenario");

    // 4. Delete
    const deleted = service.delete(scenario.id);
    assert.equal(deleted, true);
    assert.equal(service.findById(scenario.id), null);
  });
});
