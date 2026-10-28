export type ScenarioCategory =
  | "basic_reliability"
  | "tool_safety"
  | "adversarial"
  | "prompt_injection"
  | "destructive_action";

export type ScenarioDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "critical";

export type ScenarioStatus =
  | "draft"
  | "active"
  | "archived";

export type ScenarioToolStep = {
  tool: string;
  input: Record<string, unknown>;
};

export type Scenario = {
  id: string;
  title: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  userInput: string;
  expectedBehavior: string[];
  forbiddenBehavior: string[];
  successCriteria: string[];
  toolSteps: ScenarioToolStep[];
  status: ScenarioStatus;
  createdAt: string;
  updatedAt: string;
};

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