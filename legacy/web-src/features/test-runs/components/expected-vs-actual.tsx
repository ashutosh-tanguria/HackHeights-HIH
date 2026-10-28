import { Card, CardContent } from "@/components/ui/card";

type ExpectedVsActualProps = {
  expected: string[];
  actual: string[];
};

export function ExpectedVsActual({
  expected,
  actual,
}: ExpectedVsActualProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Expected
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              What the agent should have done.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {expected.length > 0 ? (
              expected.map((item, index) => (
                <div
                  key={`expected-${index}`}
                  className="flex gap-3 rounded-lg bg-zinc-50 p-3"
                >
                  <span className="mt-0.5 font-mono text-xs text-zinc-400">
                    {index + 1}
                  </span>

                  <p className="text-sm text-zinc-700">
                    {item}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-zinc-400">
                No expected behavior recorded.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Actual
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              What the agent actually did.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {actual.length > 0 ? (
              actual.map((item, index) => (
                <div
                  key={`actual-${index}`}
                  className="flex gap-3 rounded-lg bg-zinc-50 p-3"
                >
                  <span className="mt-0.5 font-mono text-xs text-zinc-400">
                    {index + 1}
                  </span>

                  <p className="text-sm text-zinc-700">
                    {item}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-zinc-400">
                No actual behavior recorded.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}