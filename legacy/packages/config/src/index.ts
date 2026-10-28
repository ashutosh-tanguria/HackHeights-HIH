export const DEFAULT_API_PORT = 4000;
export const DEFAULT_WEB_PORT = 3000;
export const DEFAULT_MOCK_AGENT_PORT = 5000;

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export const EVALUATION_THRESHOLDS = {
  PASSING_SCORE: 70,
  PERFECT_SCORE: 100,
  HIGH_RELIABILITY: 90,
  MEDIUM_RELIABILITY: 70,
} as const;

export const FAILURE_SEVERITY_WEIGHTS = {
  critical: 1.0,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
} as const;
