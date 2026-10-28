export type RegressionResult = {
  baselineRunId: string;
  currentRunId: string;
  baselineScore: number;
  currentScore: number;
  scoreDelta: number;
  regressed: boolean;
  baselineFailedTests: number;
  currentFailedTests: number;
  newFailures: number;
};