import type {
  AgentAdapter,
  AgentExecutionRequest,
  AgentExecutionResponse,
} from "./base";

export class HttpAgentAdapter
  implements AgentAdapter
{
  async execute(
    request: AgentExecutionRequest,
  ): Promise<AgentExecutionResponse> {
    const startedAt = Date.now();

    if (!request.agent.endpoint) {
      return {
        success: false,
        statusCode: null,
        output: "",
        error: "Agent endpoint is not configured",
        durationMs: Date.now() - startedAt,
      };
    }

    try {
      const response = await fetch(
        request.agent.endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: request.input,
            scenarioId: request.scenario.id,
          }),
          signal: AbortSignal.timeout(30000),
        },
      );

      const output = await response.text();

      return {
        success: response.ok,
        statusCode: response.status,
        output: output.trim(),
        error: response.ok
          ? null
          : `Agent returned HTTP ${response.status}: ${output}`,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      const isTimeout =
        error instanceof Error &&
        (error.name === "TimeoutError" ||
          error.name === "AbortError");

      return {
        success: false,
        statusCode: null,
        output: "",
        error: isTimeout
          ? "Agent request timed out"
          : error instanceof Error
            ? error.message
            : "Agent execution failed",
        durationMs: Date.now() - startedAt,
      };
    }
  }
}