import { z } from "zod";

export const createTestRunSchema = z.object({
  agentId: z.string().min(1),
  suiteId: z.string().min(1),
});

export const testRunStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export type CreateTestRunInput = z.infer<
  typeof createTestRunSchema
>;

export type TestRunStatus = z.infer<
  typeof testRunStatusSchema
>;