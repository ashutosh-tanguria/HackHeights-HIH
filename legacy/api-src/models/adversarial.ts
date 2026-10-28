import type { Scenario, ScenarioDifficulty } from "./scenario";

export type AdversarialAttackCategory =
  | "ambiguity"
  | "missing_information"
  | "prompt_injection"
  | "safety_boundary"
  | "tool_misuse"
  | "hallucination"
  | "policy_conflict"
  | "social_pressure";

export type AdversarialGenerationOptions = {
  scenarioId: string;
  count?: number;
  difficulty?: ScenarioDifficulty | "mixed";
  categories?: AdversarialAttackCategory[];
  focus?: string;
};

export type GeneratedScenario = Scenario & {
  isGenerated: boolean;
  sourceScenarioId: string;
  generationCategory: AdversarialAttackCategory;
  generationModel: string;
  generationTimestamp: string;
};
