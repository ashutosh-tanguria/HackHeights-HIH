import { z } from "zod";

export const createBatchRunSchema = z.object({
  agentId: z.string().min(1),
  scenarioIds: z.array(z.string().min(1)).min(1),
});
