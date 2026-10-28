import { Card, CardContent } from "@/components/ui/card";
import type { ReliabilityTrendPoint } from "../types";

type ReliabilityTrendProps = {
  trend: ReliabilityTrendPoint[];
};

export function ReliabilityTrend({
  trend,
}: ReliabilityTrendProps) {
  const maxScore = Math.max(
    100,
    ...trend.map((item) => item.score),
  );

  const minScore =
    trend.length > 0
      ? Math.min(...trend.map((item) => item.score))
      : 0;

  return (
    <Card>
      <CardContent>
        <div>
          <h2 className="font-semibold">Reliability Trend</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Reliability score across evaluation runs.
          </p>
        </div>

        {trend.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center">
            <p className="text-sm text-zinc-400">
              No reliability history available
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {trend.map((item) => {
              const width =
                maxScore > 0
                  ? Math.max(2, (item.score / maxScore) * 100)
                  : 0;

              return (
                <div key={item.runId}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-zinc-500">
                      {new Date(item.createdAt).toLocaleDateString()} ({item.runId})
                    </span>

                    <span className="font-medium">
                      {Math.round(item.score)}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-900 transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>

                  <div className="mt-1 flex justify-between text-xs text-zinc-400">
                    <span>
                      Status: {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {trend.length > 0 && (
          <div className="mt-6 flex justify-between text-xs text-zinc-400">
            <span>Min: {Math.round(minScore)}%</span>
            <span>Max: {Math.round(maxScore)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}