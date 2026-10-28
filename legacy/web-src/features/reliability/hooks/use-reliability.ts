import { useCallback, useEffect, useState } from "react";
import {
  getAgentReliability,
} from "../api";
import type {
  AgentReliability,
} from "../api";

export function useReliability(
  agentId?: string,
) {
  const [summary, setSummary] =
    useState<AgentReliability | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async () => {
      if (!agentId) {
        setSummary(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data =
          await getAgentReliability(
            agentId,
          );

        setSummary(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load reliability",
        );
      } finally {
        setLoading(false);
      }
    },
    [agentId],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    summary,
    loading,
    error,
    reload: load,
  };
}