"use client";

import { useCallback, useEffect, useState } from "react";
import { getAgents } from "../api";
import type { Agent } from "../types";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAgents();

      setAgents(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load agents",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
  };
}