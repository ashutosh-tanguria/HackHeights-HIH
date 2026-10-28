import type { Failure } from "../types";

type FailureCardProps = {
  failure: Failure;
};

export function FailureCard({
  failure,
}: FailureCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-zinc-950">
            {failure.title}
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            {failure.description}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
            {failure.type}
          </span>

          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
            {failure.severity}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Expected behavior
          </p>

          <div className="mt-2 space-y-1">
            {failure.expectedBehavior.map(
              (item, index) => (
                <p
                  key={`expected-${index}`}
                  className="text-sm text-zinc-700"
                >
                  {String(item)}
                </p>
              ),
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Actual behavior
          </p>

          <div className="mt-2 space-y-1">
            {failure.actualBehavior.map(
              (item, index) => (
                <p
                  key={`actual-${index}`}
                  className="text-sm text-zinc-700"
                >
                  {String(item)}
                </p>
              ),
            )}
          </div>
        </div>
      </div>

      {failure.evidence.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Evidence
          </p>

          <div className="mt-2 space-y-1">
            {failure.evidence.map(
              (item, index) => (
                <p
                  key={`evidence-${index}`}
                  className="text-sm text-zinc-700"
                >
                  {String(item)}
                </p>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}