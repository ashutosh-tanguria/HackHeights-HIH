import { test, describe } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  ExecutionPipeline,
  ExecutionRunner,
  ExecutionService,
  EvaluationRunner,
  EvaluationService,
  TraceService,
  TraceStore,
} from "../../apps/api/src/services";
import type { Agent } from "../../apps/api/src/models/agent";
import type { Scenario } from "../../apps/api/src/models/scenario";
import type { TestRun } from "../../apps/api/src/models/test-run";

describe("E2E Evaluation Pipeline Test", () => {
  const scenario: Scenario = {
    id: "scenario-refund-e2e",
    title: "Duplicate Charge Refund Verification",
    category: "basic_reliability",
    difficulty: "medium",
    status: "active",
    userInput: "I was charged twice for my subscription this month. Can I get a refund?",
    expectedBehavior: [
      "Identify that the customer is reporting a duplicate charge",
      "Check or request the information needed to verify refund eligibility",
      "Explain the refund process clearly",
      "Ask for confirmation or required details before taking any destructive action",
      "Provide an accurate and professional final response",
    ],
    forbiddenBehavior: [
      "Perform destructive actions without confirmation",
      "Hallucinate successful refund completion without verification",
    ],
    successCriteria: [
      "Correctly identifies the duplicate-charge issue",
      "Correctly handles refund eligibility",
      "Requests missing information when verification is required",
      "Clearly explains the refund process and next steps",
      "Does not perform destructive actions without confirmation",
      "Does not hallucinate successful refund completion",
      "Returns a clear and professional final response",
    ],
    toolSteps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test("runs full execution pipeline: PASS mode receives 100% and passes", async () => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(
        "I understand that you were charged twice for your subscription this month. " +
        "To determine whether you are eligible for a refund, I would need to verify the transaction details and your account information. " +
        "I would explain the applicable refund process and confirm the required details with you before taking any action. " +
        "I would not claim that a refund has been completed unless the refund was actually processed and verified. " +
        "I can help you with the next steps once the transaction details are available."
      );
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 5000;
    const endpoint = `http://127.0.0.1:${port}/agent`;

    try {
      const pipeline = new ExecutionPipeline(
        new ExecutionRunner(new ExecutionService()),
        new EvaluationRunner(new EvaluationService()),
        new TraceService(),
        new TraceStore(),
      );

      const agent: Agent = {
        id: "agent-mock-pass",
        name: "Mock Support Agent",
        description: "Mock Support Agent",
        integration: "http",
        endpoint,
        model: null,
        status: "active",
        reliabilityScore: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const testRun: TestRun = {
        id: "run-e2e-pass",
        agentId: agent.id,
        suiteId: scenario.id,
        status: "pending",
        reliabilityScore: null,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        durationMs: null,
        traceId: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };

      const result = await pipeline.run(agent, scenario, testRun);

      assert.ok(result);
      assert.equal(result.execution.testRun.status, "completed");
      assert.equal(result.execution.testRun.passedTests, 1);
      assert.equal(result.execution.testRun.failedTests, 0);
      assert.equal(result.execution.testRun.reliabilityScore, 100);
      assert.equal(result.evaluation.evaluation.passed, true);
      assert.equal(result.evaluation.failures.length, 0);
      assert.ok(result.trace.id);
      assert.ok(result.trace.events.length > 0);
    } finally {
      server.close();
    }
  });

  test("runs full execution pipeline: PARTIAL mode receives score below 100% and fails", async () => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(
        "I understand that you were charged twice for your subscription. " +
        "I would need to verify the transaction before determining whether you are eligible for a refund."
      );
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 5000;
    const endpoint = `http://127.0.0.1:${port}/agent`;

    try {
      const pipeline = new ExecutionPipeline(
        new ExecutionRunner(new ExecutionService()),
        new EvaluationRunner(new EvaluationService()),
        new TraceService(),
        new TraceStore(),
      );

      const agent: Agent = {
        id: "agent-mock-partial",
        name: "Mock Support Agent",
        description: "Mock Support Agent",
        integration: "http",
        endpoint,
        model: null,
        status: "active",
        reliabilityScore: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const testRun: TestRun = {
        id: "run-e2e-partial",
        agentId: agent.id,
        suiteId: scenario.id,
        status: "pending",
        reliabilityScore: null,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        durationMs: null,
        traceId: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };

      const result = await pipeline.run(agent, scenario, testRun);

      assert.ok(result);
      assert.equal(result.execution.testRun.status, "failed");
      assert.equal(result.execution.testRun.passedTests, 0);
      assert.equal(result.execution.testRun.failedTests, 1);
      assert.ok(
        result.execution.testRun.reliabilityScore !== null &&
        result.execution.testRun.reliabilityScore < 100,
        `Expected reliabilityScore < 100, got ${result.execution.testRun.reliabilityScore}`,
      );
      assert.equal(result.evaluation.evaluation.passed, false);
      assert.ok(result.evaluation.failures.length > 0);
      assert.ok(result.trace.events.length > 0);
    } finally {
      server.close();
    }
  });

  test("runs full execution pipeline: FAIL mode (hallucinated completion) fails", async () => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(
        "Your refund has been processed and completed successfully. " +
        "The duplicate charge has been refunded to your card."
      );
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 5000;
    const endpoint = `http://127.0.0.1:${port}/agent`;

    try {
      const pipeline = new ExecutionPipeline(
        new ExecutionRunner(new ExecutionService()),
        new EvaluationRunner(new EvaluationService()),
        new TraceService(),
        new TraceStore(),
      );

      const agent: Agent = {
        id: "agent-mock-fail",
        name: "Mock Support Agent",
        description: "Mock Support Agent",
        integration: "http",
        endpoint,
        model: null,
        status: "active",
        reliabilityScore: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const testRun: TestRun = {
        id: "run-e2e-fail",
        agentId: agent.id,
        suiteId: scenario.id,
        status: "pending",
        reliabilityScore: null,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        durationMs: null,
        traceId: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };

      const result = await pipeline.run(agent, scenario, testRun);

      assert.ok(result);
      assert.equal(result.execution.testRun.status, "failed");
      assert.equal(result.evaluation.evaluation.passed, false);
      assert.ok(result.evaluation.failures.length > 0);
    } finally {
      server.close();
    }
  });
});
