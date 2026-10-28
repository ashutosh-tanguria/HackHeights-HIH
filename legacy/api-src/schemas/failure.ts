import { z } from "zod";

export const failureTypeSchema = z.enum([
  "tool_misuse",
  "tool_loop",
  "hallucinated_success",
  "unsafe_action",
  "prompt_injection",
  "semantic_mismatch",
]);

export const failureSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const failureStatusSchema = z.enum([
  "open",
  "resolved",
  "ignored",
]);

export const updateFailureSchema = z.object({
  status: failureStatusSchema,
});

export type FailureType = z.infer<
  typeof failureTypeSchema
>;

export type FailureSeverity = z.infer<
  typeof failureSeveritySchema
>;

export type FailureStatus = z.infer<
  typeof failureStatusSchema
>;

export type UpdateFailureInput = z.infer<
  typeof updateFailureSchema
>;