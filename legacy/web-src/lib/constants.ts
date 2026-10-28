export const APP_NAME = "OOSC Agent Reliability";

export const APP_DESCRIPTION =
  "AI agent evaluation and reliability platform";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const TEST_CATEGORIES = [
  "Basic Reliability",
  "Tool Safety",
  "Adversarial",
  "Prompt Injection",
  "Destructive Actions",
] as const;

export const FAILURE_TYPES = [
  "Tool Misuse",
  "Tool Loop",
  "Hallucinated Success",
  "Unsafe Action",
  "Prompt Injection",
] as const;

export const SEVERITIES = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;

export const AGENT_INTEGRATIONS = [
  "http",
  "openai",
  "custom",
] as const;