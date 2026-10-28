import type { ToolCall } from "../../tools";

export type PromptInjectionResult = {
  detected: boolean;
  evidence: string[];
};

const injectionPatterns = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?prior\s+instructions/i,
  /disregard\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?prior\s+instructions/i,
  /forget\s+(all\s+)?previous\s+instructions/i,
  /system\s+prompt/i,
  /reveal\s+(your|the)\s+(system\s+)?instructions/i,
  /override\s+(your|the)\s+(system\s+)?instructions/i,
  /bypass\s+(your|the)\s+safety/i,
  /you\s+are\s+now\s+/i,
];

export function detectPromptInjection(
  toolCalls: ToolCall[],
  input: string,
  output: string,
): PromptInjectionResult {
  const evidence: string[] = [];

  const values = [
    input,
    output,
    ...toolCalls.flatMap((call) => [
      call.name,
      JSON.stringify(call.input),
      typeof call.output === "string"
        ? call.output
        : JSON.stringify(call.output),
    ]),
  ];

  for (const value of values) {
    for (const pattern of injectionPatterns) {
      if (pattern.test(value)) {
        evidence.push(
          `Prompt injection pattern detected: ${pattern.source}`,
        );
      }
    }
  }

  return {
    detected: evidence.length > 0,
    evidence: Array.from(
      new Set(evidence),
    ),
  };
}