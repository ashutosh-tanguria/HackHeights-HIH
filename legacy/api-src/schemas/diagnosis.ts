import { z } from "zod";
import { failureSeveritySchema } from "./failure";

export const failureDiagnosisSchema = z.object({
  id: z.string(),
  failureId: z.string(),
  runId: z.string(),
  summary: z.string(),
  rootCause: z.string(),
  category: z.string(),
  severity: failureSeveritySchema,
  confidence: z.number().min(0).max(1),
  affectedCriteria: z.array(z.string()),
  evidence: z.array(z.string()),
  executionStep: z.string(),
  recommendation: z.string(),
  suggestedTests: z.array(z.string()),
  generatedAt: z.string(),
  isAiGenerated: z.boolean(),
});
