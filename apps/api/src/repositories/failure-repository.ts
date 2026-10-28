import type { Failure } from "../models";

const failures: Failure[] = [];

export class FailureRepository {
  findAll(): Failure[] {
    return failures;
  }

  findById(id: string): Failure | null {
    return (
      failures.find((failure) => failure.id === id) ??
      null
    );
  }

  findByRunId(runId: string): Failure[] {
    return failures.filter(
      (failure) => failure.runId === runId,
    );
  }

  create(failure: Failure): Failure {
    failures.push(failure);

    return failure;
  }

  update(
    id: string,
    data: Partial<Failure>,
  ): Failure | null {
    const failure = this.findById(id);

    if (!failure) {
      return null;
    }

    Object.assign(failure, data);

    return failure;
  }
}