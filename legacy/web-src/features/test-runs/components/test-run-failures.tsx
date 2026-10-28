import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Failure } from "../../failures/types";

type TestRunFailuresProps = {
  failures: Failure[];
};

const severityVariant = {
  low: "default",
  medium: "default",
  high: "warning",
  critical: "danger",
} as const;

export function TestRunFailures({
  failures,
}: TestRunFailuresProps) {
  return (
    <Card>
      <CardContent>
        <div>
          <h2 className="font-semibold">
            Failures
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Issues detected during execution and
            evaluation.
          </p>
        </div>

        {failures.length === 0 ? (
          <div className="mt-6 flex min-h-24 items-center justify-center rounded-lg bg-zinc-50">
            <p className="text-sm text-zinc-400">
              No failures detected.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {failures.map((failure) => (
              <div
                key={failure.id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium">
                      {failure.title}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      {failure.description}
                    </p>
                  </div>

                  <Badge
                    variant={
                      severityVariant[
                        failure.severity
                      ]
                    }
                  >
                    {failure.severity}
                  </Badge>
                </div>

                {failure.evidence
                  .length > 0 && (
                  <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-50 p-4 text-xs">
                    {JSON.stringify(
                      failure.evidence,
                      null,
                      2,
                    )}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}