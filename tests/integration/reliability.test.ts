import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ReliabilityService } from "../../apps/api/src/services/reliability/reliability-service";
import { RegressionService } from "../../apps/api/src/services/regression/regression-service";
import { AgentRepository } from "../../apps/api/src/repositories/agent-repository";
import { TestRunRepository } from "../../apps/api/src/repositories/test-run-repository";
import { FailureRepository } from "../../apps/api/src/repositories/failure-repository";
import type { Agent } from "../../apps/api/src/models/agent";
import type { TestRun } from "../../apps/api/src/models/test-run";

describe("Reliability & Regression Integration Tests", () => {
  test("calculates global reliability overview accurately", () => {
    const service = new ReliabilityService();

    const runs: TestRun[] = [
      {
        id: "run-1",
        agentId: "agent-1",
        suiteId: "scenario-1",
        status: "completed",
        reliabilityScore: 100,
        totalTests: 2,
        passedTests: 2,
        failedTests: 0,
        skippedTests: 0,
        durationMs: 120,
        traceId: null,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: "run-2",
        agentId: "agent-1",
        suiteId: "scenario-1",
        status: "failed",
        reliabilityScore: 50,
        totalTests: 2,
        passedTests: 1,
        failedTests: 1,
        skippedTests: 0,
        durationMs: 150,
        traceId: null,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    const summary = service.calculate(runs);
    assert.equal(summary.totalTests, 4);
    assert.equal(summary.passedTests, 3);
    assert.equal(summary.failedTests, 1);
    assert.equal(summary.reliabilityScore, 75);
    assert.equal(summary.trend.length, 2);
  });

  test("compares baseline and current test runs for regression detection", () => {
    const service = new RegressionService();

    const baselineRun: TestRun = {
      id: "run-baseline",
      agentId: "agent-1",
      suiteId: "scenario-1",
      status: "completed",
      reliabilityScore: 100,
      totalTests: 1,
      passedTests: 1,
      failedTests: 0,
      skippedTests: 0,
      durationMs: 150,
      traceId: null,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const currentRun: TestRun = {
      id: "run-current",
      agentId: "agent-1",
      suiteId: "scenario-1",
      status: "failed",
      reliabilityScore: 50,
      totalTests: 1,
      passedTests: 0,
      failedTests: 1,
      skippedTests: 0,
      durationMs: 160,
      traceId: null,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const comparison = service.compare(baselineRun, currentRun);
    assert.equal(comparison.regressed, true);
    assert.equal(comparison.baselineScore, 100);
    assert.equal(comparison.currentScore, 50);
    assert.equal(comparison.scoreDelta, -50);
    assert.equal(comparison.newFailures, 1);
  });
});
