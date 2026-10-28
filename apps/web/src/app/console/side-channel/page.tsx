"use client";
import { useEffect, useState } from "react";
import { api, useApi } from "@/lib/api-client";
import type { SideChannelJob, SideChannelResult } from "@/lib/types";
import { Async, Badge, Banner, Button, Card, PageHeader, SourceBadge, Stat, ci, num } from "@/components/ui";

const MODES: Array<SideChannelResult["mode"]> = ["shared", "resource_limited", "cache_salted"];

/** Dot strip of the stored TTFT samples (log scale). The AUC above is computed from exactly these points. */
function Strip({ r }: { r: SideChannelResult }) {
  const s = r.samples ?? [];
  if (!s.length) return null;
  const vals = s.map((x) => x.ttftMs);
  const lo = Math.log(Math.max(1, Math.min(...vals)));
  const hi = Math.log(Math.max(...vals) + 1);
  const x = (v: number) => 10 + ((Math.log(Math.max(1, v)) - lo) / Math.max(1e-9, hi - lo)) * 580;
  return (
    <svg viewBox="0 0 600 70" className="w-full max-w-[600px]" role="img" aria-label="TTFT samples by Blue state">
      <text x="0" y="22" fontSize="10" fill="#93a1b5">idle</text>
      <text x="0" y="56" fontSize="10" fill="#93a1b5">busy</text>
      {s.map((p) => (
        <circle key={p.seq} cx={x(p.ttftMs)} cy={p.blueState === "IDLE" ? 18 : 52} r="3" fill={p.blueState === "IDLE" ? "#2dd4bf" : "#f87171"} opacity="0.7" />
      ))}
    </svg>
  );
}

export default function SideChannelPage() {
  const latest = useApi<SideChannelResult[]>("/api/v1/side-channel/latest");
  const job = useApi<SideChannelJob>("/api/v1/side-channel/status", { pollMs: 2000 });
  const [samples, setSamples] = useState(15);
  const [err, setErr] = useState<string | null>(null);
  const running = job.data?.status === "running";

  async function start(mode: string) {
    setErr(null);
    const r = await api("/api/v1/side-channel/run", { method: "POST", body: { mode, samples } });
    if (!r.ok) setErr(`${r.status === 502 ? "Target model UNAVAILABLE (HTTP 502): " : ""}${r.error}`);
    void job.refresh();
    setTimeout(() => void latest.refresh(), 1000);
  }
  const jobStatus = job.data?.status;
  const refreshLatest = latest.refresh;
  useEffect(() => {
    if (jobStatus === "completed") void refreshLatest();
  }, [jobStatus, refreshLatest]);

  const byMode = new Map((latest.data ?? []).map((r) => [r.mode, r]));
  return (
    <>
      <PageHeader title="Side-channel lab" tagline="Can Red tell whether Blue is busy from its own time-to-first-token? AUC 0.5 = no signal, 1.0 (or 0.0) = perfect leak.">
        <label className="text-xs text-[var(--muted)]">Samples per state <input type="number" min={5} max={100} value={samples} onChange={(e) => setSamples(+e.target.value)} className="ml-1 w-16 rounded border border-[var(--line)] px-1" /></label>
      </PageHeader>
      {err ? <Banner tone="bad" title="Run not started">{err}</Banner> : null}
      {running ? <Banner tone="ok" title={`Running ${job.data?.mode}`}>{job.data?.done}/{job.data?.total} samples</Banner> : null}
      {job.data?.status === "failed" ? <Banner tone="bad" title="Last run failed">{job.data.error}</Banner> : null}
      <Async loading={latest.loading} error={latest.error}>
        {MODES.map((m) => {
          const r = byMode.get(m);
          return (
            <Card key={m} title={m} right={<><Button onClick={() => start(m)} disabled={running}>Run {m}</Button>{r ? <SourceBadge source={r.source} /> : null}</>}>
              {!r ? <p className="text-[var(--muted)]">No run recorded for this mode.</p> : (
                <>
                  {r.source === "simulated" ? <Banner tone="mock" title="SIMULATED">No real model was attached for this run; the timings below are not evidence of anything.</Banner> : null}
                  <div className="flex flex-wrap gap-10">
                    <Stat label="AUC (busy vs idle)" value={num(r.auc)} sub={`95% bootstrap CI ${ci(r.aucCi95, (x) => x.toFixed(3))}`} />
                    <Stat label="Median TTFT idle / busy" value={`${num(r.ttftMedianIdleMs, 0)} / ${num(r.ttftMedianBusyMs, 0)} ms`} />
                    <Stat label="n idle / busy" value={`${r.nIdle} / ${r.nBusy}`} />
                    <Stat label="Detectable" value={r.detectableLeak === null ? "n/a" : r.detectableLeak ? <Badge tone="bad">YES</Badge> : <Badge tone="ok">NOT AT THIS n</Badge>} />
                  </div>
                  <p className="mt-3 text-[13px]">{r.interpretation}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{r.description} · {r.provider}/{r.model}</p>
                  <div className="mt-3"><Strip r={r} /></div>
                </>
              )}
            </Card>
          );
        })}
      </Async>
    </>
  );
}
