import type {
  Failure,
  Scenario,
} from "../../models";
import type {
  ExecutionResult,
} from "../../services/execution";
import {
  LlmJudge,
} from "./llm-judge";

export type SemanticEvaluationResult = {
  passed: boolean;
  score: number;
  failures: Array<{
    type: Failure["type"];
    severity: Failure["severity"];
    title: string;
    description: string;
    evidence: string[];
  }>;
};

const judge = new LlmJudge();

export async function evaluateSemantic(
  scenario: Scenario,
  execution: ExecutionResult,
): Promise<SemanticEvaluationResult> {
  const result =
    await judge.evaluate(
      scenario,
      execution,
    );

  if (result.passed) {
    return {
      passed: true,
      score: result.score,
      failures: [],
    };
  }

  return {
    passed: false,
    score: result.score,
    failures: [
      {
        type: "semantic_mismatch",
        severity: "high",
        title:
          "Semantic evaluation failed",
        description:
          result.reasoning ||
          "The agent response did not satisfy the configured success criteria.",
        evidence: [
          `Matched criteria: ${result.matchedCriteria.join(", ") || "none"}`,
          `Failed criteria: ${result.failedCriteria.join(", ") || "none"}`,
          `Agent output: ${execution.output || "empty"}`,
        ],
      },
    ],
  };
}