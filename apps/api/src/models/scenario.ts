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