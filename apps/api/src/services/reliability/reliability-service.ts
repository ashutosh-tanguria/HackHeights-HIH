import type { Agent, TestRun } from "../../models";

export type ReliabilityTrendPoint = {
  runId: string;
  score: number;
  status: TestRun["status"];
  createdAt: string;
};

export type ReliabilitySummary = {
  agentId: string | null;
  reliabilityScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  trend: ReliabilityTrendPoint[];
};

export class ReliabilityService {
  calculate(
    runs: TestRun[],
    agent: Agent | null = null,
  ): ReliabilitySummary {
    const totalTests = runs.reduce(
      (sum, run) => sum + run.totalTests,
      0,
    );

    const passedTests = runs.reduce(
      (sum, run) => sum + run.passedTests,
      0,
    );

    const failedTests = runs.reduce(
      (sum, run) => sum + run.failedTests,
      0,
    );

    const reliabilityScore =
      totalTests > 0
        ? (passedTests / totalTests) * 100
        : 0;

    const trend = [...runs]
      .filter(
        (run) =>
          run.reliabilityScore !== null,
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime(),
      )
      .map((run) => ({
        runId: run.id,
        score: run.reliabilityScore ?? 0,
        status: run.status,
        createdAt: run.createdAt,
      }));

    return {
      agentId: agent?.id ?? null,
      reliabilityScore,
      totalTests,
      passedTests,
      failedTests,
      trend,
    };
  }
}