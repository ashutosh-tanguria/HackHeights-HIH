"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

/** All requests go through the console's server-side proxy (/api/bayora/*), which attaches the admin key. */
export async function api<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown }): Promise<ApiResult<T>> {
  try {
    const r = await fetch(`/api/bayora${path}`, {
      method: init?.method ?? "GET",
      headers: { "content-type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
    const text = await r.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* non-JSON body */
    }
    const message = (json as { error?: { message?: string } } | null)?.error?.message;
    return { ok: r.ok, status: r.status, data: (json as T) ?? null, error: r.ok ? null : message ?? `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: `Network error: ${(e as Error).message}` };
  }
}

export function useApi<T>(path: string | null, opts: { pollMs?: number } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    if (!path) return;
    const r = await api<T>(path);
    if (!alive.current) return;
    setLoading(false);
    if (r.ok) {
      setData(r.data);
      setError(null);
    } else setError(r.error);
  }, [path]);

  useEffect(() => {
    alive.current = true;
    void refresh();
    const t = opts.pollMs ? setInterval(() => void refresh(), opts.pollMs) : null;
    return () => {
      alive.current = false;
      if (t) clearInterval(t);
    };
  }, [refresh, opts.pollMs]);

  return { data, error, loading, refresh };
}
