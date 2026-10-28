import type {
  AgentAdapter,
  AgentExecutionRequest,
  AgentExecutionResponse,
} from "./base";
import { env } from "../../config/env";

export class OpenAIAgentAdapter
  implements AgentAdapter
{
  async execute(
    request: AgentExecutionRequest,
  ): Promise<AgentExecutionResponse> {
    const startedAt = Date.now();

    if (!env.OPENAI_API_KEY) {
      return {
        success: false,
        statusCode: null,
        output: "",
        error:
          "OPENAI_API_KEY is not configured",
        durationMs:
          Date.now() - startedAt,
      };
    }

    try {
      const response = await fetch(
        request.agent.endpoint ??
          "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model:
              request.agent.model ??
              "gpt-5.6-mini",
            input: request.input,
          }),
          signal: AbortSignal.timeout(30000),
        },
      );

      const rawBody =
        await response.text();

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          output: "",
          error:
            `OpenAI returned HTTP ${response.status}: ${rawBody}`,
          durationMs:
            Date.now() - startedAt,
        };
      }

      let output = "";

      try {
        const data = JSON.parse(rawBody);
        if (typeof data.output_text === "string") {
          output = data.output_text.trim();
        } else if (
          Array.isArray(data.choices) &&
          typeof data.choices[0]?.message?.content === "string"
        ) {
          output = data.choices[0].message.content.trim();
        } else if (
          Array.isArray(data.content) &&
          typeof data.content[0]?.text === "string"
        ) {
          output = data.content[0].text.trim();
        } else if (typeof data.output === "string") {
          output = data.output.trim();
        }
      } catch {
        output = rawBody.trim();
      }

      if (!output) {
        return {
          success: false,
          statusCode: response.status,
          output: "",
          error:
            "OpenAI returned an empty response",
          durationMs:
            Date.now() - startedAt,
        };
      }

      return {
        success: true,
        statusCode: response.status,
        output,
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
          ? "OpenAI request timed out"
          : error instanceof Error
            ? error.message
            : "OpenAI execution failed",
        durationMs:
          Date.now() - startedAt,
      };
    }
  }
}