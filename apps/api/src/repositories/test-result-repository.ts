import type { TestResult } from "../models";

const testResults: TestResult[] = [];

export class TestResultRepository {
  findAll(): TestResult[] {
    return testResults;
  }

  findById(id: string): TestResult | null {
    return (
      testResults.find(
        (testResult) => testResult.id === id,
      ) ?? null
    );
  }

  findByRunId(runId: string): TestResult[] {
    return testResults.filter(
      (testResult) => testResult.runId === runId,
    );
  }

  create(testResult: TestResult): TestResult {
    testResults.push(testResult);

    return testResult;
  }
}