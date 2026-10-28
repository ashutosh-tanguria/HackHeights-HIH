export type EvaluatorType = "deterministic" | "semantic" | "hybrid";

export type EvaluationFailure = {
  type:
    | "tool_misuse"
    | "tool_loop"
    | "hallucinated_success"
    | "unsafe_action"
    | "prompt_injection"
    | "semantic_mismatch";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  evidence: string[];
};

export type EvaluationResult = {
  passed: boolean;
  score: number;
  failures: EvaluationFailure[];
};
