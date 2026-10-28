import { z } from "zod";

export const regressionStatusSchema = z.enum([
  "improved",
  "stable",
  "regressed",
  "not_evaluated",
]);

export const compareVersionsSchema = z.object({
  previousVersionId: z.string().min(1),
  currentVersionId: z.string().min(1),
  previousScore: z.number().min(0).max(100).optional(),
  currentScore: z.number().min(0).max(100).optional(),
  newFailures: z.number().int().min(0).optional(),
  resolvedFailures: z.number().int().min(0).optional(),
});

export type RegressionStatus = z.infer<
  typeof regressionStatusSchema
>;

export type CompareVersionsInput = z.infer<
  typeof compareVersionsSchema
>;