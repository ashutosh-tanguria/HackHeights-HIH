"use client";

import { useCallback, useEffect, useState } from "react";
import { getScenarios } from "../api";
import type { Scenario } from "../types";

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScenarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getScenarios();

      setScenarios(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load scenarios",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  return {
    scenarios,
    loading,
    error,
    refetch: fetchScenarios,
  };
}