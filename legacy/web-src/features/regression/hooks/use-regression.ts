"use client";

import { useCallback, useEffect, useState } from "react";
import {
  compareRuns,
  type RegressionResult,
} from "../api";

type RegressionState = {
  data: RegressionResult | null;
  loading: boolean;
  error: string | null;
};

export function useRegression(
  baselineRunId?: string,
  currentRunId?: string,
) {
  const [state, setState] =
    useState<RegressionState>({
      data: null,
      loading: false,
      error: null,
    });

  const compare = useCallback(
    async (
      baselineId: string,
      currentId: string,
    ) => {
      setState({
        data: null,
        loading: true,
        error: null,
      });

      try {
        const result =
          await compareRuns(
            baselineId,
            currentId,
          );

        setState({
          data: result,
          loading: false,
          error: null,
        });

        return result;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to compare runs";

        setState({
          data: null,
          loading: false,
          error: message,
        });

        return null;
      }
    },
    [],
  );

  useEffect(() => {
    if (
      !baselineRunId ||
      !currentRunId ||
      baselineRunId === currentRunId
    ) {
      return;
    }

    void compare(
      baselineRunId,
      currentRunId,
    );
  }, [
    baselineRunId,
    currentRunId,
    compare,
  ]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    compare,
  };
}