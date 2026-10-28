"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AgentIntegration } from "../types";

type AgentFormProps = {
  onSubmit?: (data: {
    name: string;
    description: string;
    integration: AgentIntegration;
    endpoint: string | null;
    model: string | null;
  }) => void;
};

export function AgentForm({
  onSubmit,
}: AgentFormProps) {
  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData =
      new FormData(event.currentTarget);

    const integration = String(
      formData.get("integration") ?? "http",
    ) as AgentIntegration;

    onSubmit?.({
      name: String(
        formData.get("name") ?? "",
      ),
      description: String(
        formData.get("description") ?? "",
      ),
      integration,
      endpoint:
        String(
          formData.get("endpoint") ?? "",
        ).trim() || null,
      model:
        String(
          formData.get("model") ?? "",
        ).trim() || null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <section className="rounded-xl border bg-white p-6">
        <div>
          <h2 className="font-semibold">
            Agent Details
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Define the agent that will be evaluated.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <Label htmlFor="name">
              Agent name
            </Label>

            <Input
              id="name"
              name="name"
              placeholder="e.g. Customer Support Agent"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">
              Description
            </Label>

            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe what this agent does."
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <div>
          <h2 className="font-semibold">
            Agent Adapter
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Choose how the evaluation engine communicates with the agent.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-zinc-50">
            <input
              type="radio"
              name="integration"
              value="http"
              defaultChecked
              className="mt-1 h-4 w-4"
            />

            <div>
              <p className="text-sm font-medium">
                HTTP Adapter
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Send standardized evaluation requests to an HTTP endpoint.
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-zinc-50">
            <input
              type="radio"
              name="integration"
              value="openai"
              className="mt-1 h-4 w-4"
            />

            <div>
              <p className="text-sm font-medium">
                OpenAI
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Evaluate the agent using the OpenAI Responses API.
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-zinc-50">
            <input
              type="radio"
              name="integration"
              value="custom"
              className="mt-1 h-4 w-4"
            />

            <div>
              <p className="text-sm font-medium">
                Custom Adapter
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Connect an agent through the OOSC adapter contract.
              </p>
            </div>
          </label>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <div>
          <h2 className="font-semibold">
            Connection
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Configuration used by the selected adapter.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <Label htmlFor="endpoint">
              Endpoint
            </Label>

            <Input
              id="endpoint"
              name="endpoint"
              type="url"
              placeholder="https://your-agent.example.com/run"
            />

            <p className="mt-2 text-xs text-zinc-400">
              Leave empty for OpenAI to use the default Responses API endpoint.
            </p>
          </div>

          <div>
            <Label htmlFor="model">
              Model
            </Label>

            <Input
              id="model"
              name="model"
              placeholder="e.g. gpt-5"
            />

            <p className="mt-2 text-xs text-zinc-400">
              For OpenAI, specify the model you want to evaluate.
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit">
          Add Agent
        </Button>
      </div>
    </form>
  );
}