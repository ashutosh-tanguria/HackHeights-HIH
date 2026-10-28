"use client";
import { Fragment, useState } from "react";
import { api, useApi } from "@/lib/api-client";
import type { ProbeResult, ProbeRun } from "@/lib/types";
import { Async, Badge, Banner, Button, Card, PageHeader, Stat, fmtTime } from "@/components/ui";

function verdict(p: ProbeResult) {
  if (p.observed === "ERROR") return <Badge tone="warn">INCONCLUSIVE</Badge>;
  if (p.expect === "DENIED") return p.passed ? <Badge tone="ok">BLOCKED</Badge> : <Badge tone="bad">LEAKED</Badge>;
  return p.passed ? <Badge tone="ok">ALLOWED (control)</Badge> : <Badge tone="bad">BROKEN (control)</Badge>;
}

export default function ProbesPage() {
  const { data, error, loading, refresh } = useApi<ProbeRun | { status: "NONE"; message: string }>("/api/v1/probes/latest");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setRunError(null);
    const r = await api<ProbeRun>("/api/v1/probes/run", { method: "POST" });
    if (!r.ok) setRunError(r.error);
    setRunning(false);
    void refresh();
  }

  const run1 = data && "results" in data ? data : null;
  return (
    <>
      <PageHeader title="Isolation probes" tagline="Real commands executed inside the red and blue containers with docker exec. Raw evidence is stored in the audit chain.">
        <Button onClick={run} disabled={running}>{running ? "Running probes…" : "Run probes"}</Button>
      </PageHeader>
      {runError ? <Banner tone="bad" title="Probe run failed">{runError}</Banner> : null}
      <Async loading={loading} error={error}>
        {data && "message" in data ? <Banner title="No probe run recorded">{data.message}</Banner> : null}
        {run1?.status === "UNAVAILABLE" ? <Banner tone="bad" title="UNAVAILABLE: no pretend result">{run1.reason}</Banner> : null}
        {run1 && run1.status === "EXECUTED" ? (
          <>
            <Card>
              <div className="flex flex-wrap gap-8">
                <Stat label="As expected" value={`${run1.passed}/${run1.total}`} />
                <Stat label="Unexpected" value={run1.failed} />
                <Stat label="Inconclusive" value={run1.inconclusive} />
                <Stat label="Run" value={<span className="mono">{run1.id}</span>} sub={fmtTime(run1.finishedAt)} />
              </div>
              <p className="mt-3 text-[13px] text-[var(--muted)]">BLOCKED = a denial was expected and observed. A connection refused by the peer counts as REACHED, because it proves a route exists. Controls must be ALLOWED, otherwise a blocked result could just mean the test itself is broken.</p>
            </Card>
            <Card>
              <table>
                <thead><tr><th>Probe</th><th>In</th><th>Expected</th><th>Observed</th><th>Verdict</th><th>Detail</th></tr></thead>
                <tbody>
                  {run1.results.map((p) => (
                    <Fragment key={p.id}>
                      <tr className="cursor-pointer hover:bg-[var(--panel-2)]" onClick={() => setOpen(open === p.id ? null : p.id)}>
                        <td className="font-medium">{p.title} <span className="text-[11px] text-[var(--muted)]">{open === p.id ? "▾ evidence" : "▸ evidence"}</span></td>
                        <td className="mono">{p.container}</td>
                        <td className="mono">{p.expect}</td>
                        <td className="mono">{p.observed}</td>
                        <td>{verdict(p)}</td>
                        <td className="text-[var(--muted)]">{p.detail}</td>
                      </tr>
                      {open === p.id ? (
                        <tr><td colSpan={6} className="bg-[var(--bg)]">
                          <div className="mono space-y-1 break-all rounded-md border border-[var(--line)] bg-black/40 p-3 text-[#b6f5ea]">
                            <div>$ {p.evidence.command}</div>
                            <div>exit {String(p.evidence.exitCode)} · {p.evidence.durationMs} ms</div>
                            <div>stdout: {p.evidence.stdout || "(empty)"}</div>
                            {p.evidence.stderr ? <div>stderr: {p.evidence.stderr}</div> : null}
                          </div>
                        </td></tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        ) : null}
      </Async>
    </>
  );
}
