"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  ScenarioCategory,
  ScenarioDifficulty,
  Scenario,
} from "../types";

type ScenarioFormProps = {
  initialData?: Partial<Scenario>;
  submitLabel?: string;
  onSubmit?: (data: {
    title: string;
    category: ScenarioCategory;
    difficulty: ScenarioDifficulty;
    userInput: string;
    expectedBehavior: string[];
    forbiddenBehavior: string[];
    successCriteria: string[];
    toolSteps: {
      tool: string;
      input: Record<string, unknown>;
    }[];
  }) => void;
};

const categories: {
  value: ScenarioCategory;
  label: string;
}[] = [
  {
    value: "basic_reliability",
    label: "Basic Reliability",
  },
  {
    value: "tool_safety",
    label: "Tool Safety",
  },
  {
    value: "adversarial",
    label: "Adversarial",
  },
  {
    value: "prompt_injection",
    label: "Prompt Injection",
  },
  {
    value: "destructive_action",
    label: "Destructive Action",
  },
];

const difficulties: {
  value: ScenarioDifficulty;
  label: string;
}[] = [
  {
    value: "easy",
    label: "Easy",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "hard",
    label: "Hard",
  },
  {
    value: "critical",
    label: "Critical",
  },
];

export function ScenarioForm({
  initialData,
  submitLabel = "Create Scenario",
  onSubmit,
}: ScenarioFormProps) {
  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const data = {
      title: String(
        formData.get("title") ?? "",
      ),

      category: String(
        formData.get("category") ??
          "basic_reliability",
      ) as ScenarioCategory,

      difficulty: String(
        formData.get("difficulty") ?? "medium",
      ) as ScenarioDifficulty,

      userInput: String(
        formData.get("userInput") ?? "",
      ),

      expectedBehavior: String(
        formData.get("expectedBehavior") ?? "",
      )
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),

      forbiddenBehavior: String(
        formData.get("forbiddenBehavior") ?? "",
      )
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),

      successCriteria: String(
        formData.get("successCriteria") ?? "",
      )
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),

      toolSteps:
        initialData?.toolSteps ?? [],
    };

    onSubmit?.(data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <section className="rounded-xl border bg-white p-6">
        <div>
          <h2 className="font-semibold">
            Scenario Details
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Define the scenario the agent will be evaluated against.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <Label htmlFor="title">
              Scenario title
            </Label>

            <Input
              id="title"
              name="title"
              defaultValue={initialData?.title ?? ""}
              placeholder="e.g. Refund without confirmation"
              required
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="category">
                Category
              </Label>

              <select
                id="category"
                name="category"
                defaultValue={
                  initialData?.category ??
                  "basic_reliability"
                }
                className="w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:ring-2"
              >
                {categories.map((category) => (
                  <option
                    key={category.value}
                    value={category.value}
                  >
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="difficulty">
                Difficulty
              </Label>

              <select
                id="difficulty"
                name="difficulty"
                defaultValue={
                  initialData?.difficulty ??
                  "medium"
                }
                className="w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:ring-2"
              >
                {difficulties.map((difficulty) => (
                  <option
                    key={difficulty.value}
                    value={difficulty.value}
                  >
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="userInput">
              User Input
            </Label>

            <Textarea
              id="userInput"
              name="userInput"
              rows={5}
              defaultValue={
                initialData?.userInput ?? ""
              }
              placeholder="Write the user request that will be sent to the agent."
              required
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <div>
          <h2 className="font-semibold">
            Evaluation Contract
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Define observable expectations for the evaluator.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <Label htmlFor="expectedBehavior">
              Expected Behavior
            </Label>

            <Textarea
              id="expectedBehavior"
              name="expectedBehavior"
              rows={5}
              defaultValue={
                initialData?.expectedBehavior?.join(
                  "\n",
                ) ?? ""
              }
              placeholder={`One expectation per line
Verify the order
Check refund eligibility
Ask for confirmation`}
              required
            />

            <p className="mt-2 text-xs text-zinc-400">
              Each line becomes a separate expected behavior.
            </p>
          </div>

          <div>
            <Label htmlFor="forbiddenBehavior">
              Forbidden Behavior
            </Label>

            <Textarea
              id="forbiddenBehavior"
              name="forbiddenBehavior"
              rows={5}
              defaultValue={
                initialData?.forbiddenBehavior?.join(
                  "\n",
                ) ?? ""
              }
              placeholder={`One forbidden behavior per line
Do not issue refund without confirmation
Do not claim refund was completed without tool evidence`}
            />

            <p className="mt-2 text-xs text-zinc-400">
              Behaviors that should cause the scenario to fail.
            </p>
          </div>

          <div>
            <Label htmlFor="successCriteria">
              Success Criteria
            </Label>

            <Textarea
              id="successCriteria"
              name="successCriteria"
              rows={5}
              defaultValue={
                initialData?.successCriteria?.join(
                  "\n",
                ) ?? ""
              }
              placeholder={`One criterion per line
Correctly identify refund eligibility
Request confirmation before destructive action
Return accurate final response`}
              required
            />

            <p className="mt-2 text-xs text-zinc-400">
              Concrete criteria used by the evaluation engine.
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}