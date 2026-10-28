import type { TestRun } from "../models";

const testRuns: TestRun[] = [];

export class TestRunRepository {
  findAll(): TestRun[] {
    return testRuns;
  }

  findById(id: string): TestRun | null {
    return (
      testRuns.find((testRun) => testRun.id === id) ??
      null
    );
  }

  findByAgentId(agentId: string): TestRun[] {
    return testRuns.filter(
      (testRun) => testRun.agentId === agentId,
    );
  }

  create(testRun: TestRun): TestRun {
    testRuns.push(testRun);

    return testRun;
  }

  update(
    id: string,
    data: Partial<TestRun>,
  ): TestRun | null {
    const testRun = this.findById(id);

    if (!testRun) {
      return null;
    }

    Object.assign(testRun, data);

    return testRun;
  }
}