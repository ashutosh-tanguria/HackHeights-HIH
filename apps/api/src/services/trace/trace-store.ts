import type { ExecutionTrace } from "./trace-service";

const traces = new Map<string, ExecutionTrace>();

export class TraceStore {
  create(trace: ExecutionTrace): ExecutionTrace {
    traces.set(trace.id, trace);

    return trace;
  }

  findById(id: string): ExecutionTrace | null {
    return traces.get(id) ?? null;
  }

  findByScenarioId(
    scenarioId: string,
  ): ExecutionTrace[] {
    return Array.from(traces.values()).filter(
      (trace) => trace.scenarioId === scenarioId,
    );
  }

  delete(id: string): boolean {
    return traces.delete(id);
  }
}