import { useCallback, useEffect, useState } from "react";
import {
  getFailures,
} from "../api";
import type { Failure } from "../types";

export function useFailures(
  runId?: string,
) {
  const [failures, setFailures] =
    useState<Failure[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadFailures =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const data =
          await getFailures();

        setFailures(
          runId
            ? data.filter(
                (failure) =>
                  failure.runId === runId,
              )
            : data,
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load failures",
        );
      } finally {
        setLoading(false);
      }
    }, [runId]);

  useEffect(() => {
    loadFailures();
  }, [loadFailures]);

  return {
    failures,
    loading,
    error,
    reload: loadFailures,
  };
}