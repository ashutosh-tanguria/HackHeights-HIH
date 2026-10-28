import type {
  TestRun,
} from "../../models";
import {
  TestRunRepository,
} from "../../repositories";

export class TestRunService {
  constructor(
    private readonly testRunRepository: TestRunRepository,
  ) {}

  findAll(): TestRun[] {
    return this.testRunRepository.findAll();
  }

  findById(id: string): TestRun | null {
    return this.testRunRepository.findById(id);
  }

  findByAgentId(agentId: string): TestRun[] {
    return this.testRunRepository.findByAgentId(
      agentId,
    );
  }

  create(
    agentId: string,
    suiteId: string,
  ): TestRun {
    const testRun: TestRun = {
      id: crypto.randomUUID(),
      agentId,
      suiteId,
      traceId: null,
      status: "queued",
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      reliabilityScore: null,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      createdAt: new Date().toISOString(),
    };

    return this.testRunRepository.create(testRun);
  }

  update(
    id: string,
    data: Partial<TestRun>,
  ): TestRun | null {
    return this.testRunRepository.update(
      id,
      data,
    );
  }
}