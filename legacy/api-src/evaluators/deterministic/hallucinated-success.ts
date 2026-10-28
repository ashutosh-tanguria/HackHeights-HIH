export type HallucinatedSuccessResult = {
  detected: boolean;
  reason: string | null;
};

export function detectHallucinatedSuccess(
  executionSuccess: boolean,
  output: string,
  error: string | null,
): HallucinatedSuccessResult {
  if (!executionSuccess && !error && output.trim().length === 0) {
    return {
      detected: true,
      reason: "Agent execution failed with empty output",
    };
  }

  return {
    detected: false,
    reason: null,
  };
}