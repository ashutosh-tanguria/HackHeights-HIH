import type {
  AgentAdapter,
  AgentExecutionRequest,
  AgentExecutionResponse,
} from "./base";
import { env } from "../../config/env";

export class CustomAgentAdapter
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

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (env.OPENAI_API_KEY) {
      headers.Authorization = `Bearer ${env.OPENAI_API_KEY}`;
    }

    try {
      const response = await fetch(
        request.agent.endpoint,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            model:
              request.agent.model ??
              "gpt-5.6-mini",
            input: request.input,
            scenarioId: request.scenario.id,
          }),
          signal: AbortSignal.timeout(30000),
        },
      );

      const rawBody = await response.text();

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          output: rawBody,
          error: `Agent returned HTTP ${response.status}`,
          durationMs:
            Date.now() - startedAt,
        };
      }

      let output = rawBody;

      try {
        const data = JSON.parse(rawBody);

        if (typeof data === "string") {
          output = data;
        } else if (
          typeof data.output === "string"
        ) {
          output = data.output;
        } else if (
          typeof data.output_text === "string"
        ) {
          output = data.output_text;
        } else if (
          typeof data.response === "string"
        ) {
          output = data.response;
        } else if (
          typeof data.text === "string"
        ) {
          output = data.text;
        } else if (
          Array.isArray(data.choices) &&
          typeof data.choices[0]?.message
            ?.content === "string"
        ) {
          output =
            data.choices[0].message.content;
        } else if (
          Array.isArray(data.content) &&
          typeof data.content[0]?.text ===
            "string"
        ) {
          output =
            data.content[0].text;
        }
      } catch {
        // Keep raw text response.
      }

      return {
        success: true,
        statusCode: response.status,
        output: output.trim(),
        error: null,
        durationMs:
          Date.now() - startedAt,
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
        durationMs:
          Date.now() - startedAt,
      };
    }
  }
}