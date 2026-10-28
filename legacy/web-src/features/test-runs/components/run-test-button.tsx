"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTestRun } from "../api";

type RunTestButtonProps = {
  agentId: string;
  suiteId: string;
};

export function RunTestButton({
  agentId,
  suiteId,
}: RunTestButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    console.log("Starting test run", {
      agentId,
      suiteId,
    });

    try {
      setLoading(true);
      setError(null);

      const result = await createTestRun({
  agentId,
  suiteId,
});

console.log("Test run created", result);

router.push(`/runs/${result.testRun.id}`);
    } catch (error) {
      console.error("Failed to start test run", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to start test run",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        onClick={handleRun}
        disabled={loading}
      >
        {loading ? "Starting..." : "Run Tests"}
      </Button>

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}