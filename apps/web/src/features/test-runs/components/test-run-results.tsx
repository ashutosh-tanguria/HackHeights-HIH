import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TestResult } from "../types";

type TestRunResultsProps = {
  results: TestResult[];
};

export function TestRunResults({
  results,
}: TestRunResultsProps) {
  return (
    <Card>
      <CardContent>
        <div>
          <h2 className="font-semibold">
            Test Results
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Evaluation results produced by the
            execution pipeline.
          </p>
        </div>

        {results.length === 0 ? (
          <div className="mt-6 flex min-h-24 items-center justify-center rounded-lg bg-zinc-50">
            <p className="text-sm text-zinc-400">
              No test results available.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      Scenario {result.scenarioId}
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                      {new Date(
                        result.createdAt,
                      ).toLocaleString()}
                    </p>
                  </div>

                  <Badge
                    variant={
                      result.status ===
                      "passed"
                        ? "success"
                        : "danger"
                    }
                  >
                    {result.status}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-zinc-400">
                      Score
                    </p>

                    <p className="mt-1 text-sm">
                      {result.score !== null
                        ? `${result.score}%`
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-zinc-400">
                      Expected
                    </p>

                    <p className="mt-1 text-sm">
                      {
                        result
                          .expectedBehavior
                          .length
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-zinc-400">
                      Duration
                    </p>

                    <p className="mt-1 text-sm">
                      {result.durationMs !==
                      null
                        ? `${result.durationMs} ms`
                        : "-"}
                    </p>
                  </div>
                </div>

                {result.actualBehavior
                  .length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-zinc-400">
                      Agent Output
                    </p>

                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-xs leading-5">
                      {result.actualBehavior.join(
                        "\n",
                      )}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}