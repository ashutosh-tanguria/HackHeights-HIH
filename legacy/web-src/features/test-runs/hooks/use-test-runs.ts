"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  createTestRun,
  getTestRun,
  getTestRunFailures,
  getTestRunResults,
  getTestRunTrace,
  getTestRuns,
} from "../api";
import type {
  ExecutionTrace,
  TestResult,
  TestRun,
} from "../types";
import type { Failure } from "../../failures/types";

type TestRunState = {
  runs: TestRun[];
  loading: boolean;
  error: string | null;
};

export function useTestRuns() {
  const [state, setState] =
    useState<TestRunState>({
      runs: [],
      loading: true,
      error: null,
    });

  const load = useCallback(
    async () => {
      try {
        setState((current) => ({
          ...current,
          loading: true,
          error: null,
        }));

        const runs = await getTestRuns();

        setState({
          runs,
          loading: false,
          error: null,
        });

        return runs;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load test runs";

        setState((current) => ({
          ...current,
          loading: false,
          error: message,
        }));

        return [];
      }
    },
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...state,
    reload: load,
  };
}

export function useTestRun(
  runId?: string,
) {
  const [run, setRun] =
    useState<TestRun | null>(null);

  const [loading, setLoading] =
    useState(Boolean(runId));

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    if (!runId) {
      setRun(null);
      setLoading(false);
      setError(null);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const data =
        await getTestRun(runId);

      setRun(data);

      return data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load test run";

      setRun(null);
      setError(message);

      return null;
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    run,
    loading,
    error,
    reload: load,
  };
}

export function useTestRunDetails(
  runId?: string,
) {
  const [results, setResults] =
    useState<TestResult[]>([]);

  const [failures, setFailures] =
    useState<Failure[]>([]);

  const [trace, setTrace] =
    useState<ExecutionTrace | null>(null);

  const [loading, setLoading] =
    useState(Boolean(runId));

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    if (!runId) {
      setResults([]);
      setFailures([]);
      setTrace(null);
      setLoading(false);
      setError(null);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const run =
        await getTestRun(runId);

      const [
        runResults,
        runFailures,
        runTrace,
      ] = await Promise.all([
        getTestRunResults(runId),
        getTestRunFailures(runId),
        getTestRunTrace(
          runId,
          run.traceId,
        ),
      ]);

      setResults(runResults);
      setFailures(runFailures);
      setTrace(runTrace);

      return {
        run,
        results: runResults,
        failures: runFailures,
        trace: runTrace,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load test run details";

      setResults([]);
      setFailures([]);
      setTrace(null);
      setError(message);

      return null;
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    results,
    failures,
    trace,
    loading,
    error,
    reload: load,
  };
}

export function useCreateTestRun() {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const execute = useCallback(
    async (
      agentId: string,
      suiteId: string,
    ) => {
      try {
        setLoading(true);
        setError(null);

        const result =
          await createTestRun({
            agentId,
            suiteId,
          });

        return result;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to create test run";

        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    create: execute,
    loading,
    error,
  };
}