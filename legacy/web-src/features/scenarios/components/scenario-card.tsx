import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Scenario } from "../types";

type ScenarioCardProps = {
  scenario: Scenario;
};

const difficultyVariant = {
  easy: "success",
  medium: "default",
  hard: "warning",
  critical: "danger",
} as const;

export function ScenarioCard({
  scenario,
}: ScenarioCardProps) {
  return (
    <Link href={`/scenarios/${scenario.id}`}>
      <Card className="transition hover:bg-zinc-50">
        <CardContent>
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">
                  {scenario.title}
                </h3>

                <Badge
                  variant={
                    difficultyVariant[
                      scenario.difficulty
                    ]
                  }
                >
                  {scenario.difficulty}
                </Badge>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                {scenario.userInput}
              </p>
            </div>

            <Badge>
              {scenario.status}
            </Badge>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-zinc-400">
                Category
              </p>

              <p className="mt-1 text-sm capitalize">
                {scenario.category.replaceAll(
                  "_",
                  " ",
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400">
                Tool Steps
              </p>

              <p className="mt-1 text-sm">
                {scenario.toolSteps.length}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-400">
                Success Criteria
              </p>

              <p className="mt-1 text-sm">
                {scenario.successCriteria.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}