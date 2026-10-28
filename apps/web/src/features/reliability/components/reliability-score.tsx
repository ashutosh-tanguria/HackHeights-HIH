import { Card, CardContent } from "@/components/ui/card";
import { formatPercentage } from "@/lib/utils";

type ReliabilityScoreProps = {
  score: number | null;
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
};

export function ReliabilityScore({
  score,
  totalTests = 0,
  passedTests = 0,
  failedTests = 0,
}: ReliabilityScoreProps) {
  const passRate =
    totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  const failureRate =
    totalTests > 0 ? (failedTests / totalTests) * 100 : 0;

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Reliability Score
            </p>

            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {formatPercentage(score)}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Overall agent reliability
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4">
            <span className="text-sm font-semibold">
              {score === null ? "--" : Math.round(score)}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">Pass Rate</p>
            <p className="mt-1 font-semibold">
              {formatPercentage(passRate)}
            </p>
          </div>

          <div className="rounded-lg bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">Failure Rate</p>
            <p className="mt-1 font-semibold">
              {formatPercentage(failureRate)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}