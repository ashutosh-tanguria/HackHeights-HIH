"use client";
import { useState } from "react";
import { api, useApi } from "@/lib/api-client";
import type { Anomaly, AuditEvent, AuditVerify, TamperResult } from "@/lib/types";
import { Async, Badge, Banner, Button, Card, PageHeader, Stat, fmtTime } from "@/components/ui";

function Step({ label, ok, text }: { label: string; ok: boolean; text: string }) {
  const c = ok ? "var(--ok)" : "var(--bad)";
  return (
    <div className="min-w-[160px] rounded-xl border bg-[var(--panel-2)] px-5 py-4" style={{ borderColor: c }}>
      <div className="label">{label}</div>
      <div className="mt-1 text-[28px] font-bold tabular-nums" style={{ color: c }}>{text}</div>
    </div>
  );
}
const Arrow = () => <div className="flex items-center text-2xl text-[var(--muted)]" aria-hidden="true">→</div>;

export default function AuditPage() {
  const events = useApi<{ total: number; events: AuditEvent[] }>("/api/v1/audit?limit=100", { pollMs: 8000 });
  const verify = useApi<AuditVerify>("/api/v1/audit/verify", { pollMs: 8000 });
  const anomalies = useApi<Anomaly[]>("/api/v1/anomalies", { pollMs: 8000 });
  const [tamper, setTamper] = useState<TamperResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function runTamper() {
    setBusy(true);
    setErr(null);
    const r = await api<TamperResult>("/api/v1/audit/tamper-demo", { method: "POST", body: {} });
    if (r.ok) setTamper(r.data);
    else setErr(r.error);
    setBusy(false);
    void events.refresh();
    void verify.refresh();
  }

  const v = verify.data;
  return (
    <>
      <PageHeader title="Audit" tagline="SHA-256 hash chain in SQLite, Ed25519 signed checkpoints, independently verifiable export.">
        <Button kind="ghost" onClick={() => { void verify.refresh(); void events.refresh(); }}>Verify now</Button>
        <Button kind="danger" onClick={runTamper} disabled={busy}>{busy ? "Tampering…" : "Run tamper demo"}</Button>
        <a className="rounded-md border border-[var(--line-2)] px-3.5 py-2 text-[13px] font-semibold text-[var(--ink)] no-underline hover:bg-[var(--panel-2)]" href="/api/bayora/api/v1/audit/export" download="bayora-audit-bundle.json">Export bundle</a>
      </PageHeader>
      {err ? <Banner tone="bad" title="Tamper demo failed">{err}</Banner> : null}
      <Async loading={verify.loading} error={verify.error}>
        {v ? (
          <Card title="Chain verification">
            <div className="flex flex-wrap items-center gap-10">
              <Stat label="Hash chain" value={v.isValid ? <Badge tone="ok">VERIFIED</Badge> : <Badge tone="bad">FAIL at #{v.brokenIndex}</Badge>} sub={`${v.totalEvents} events`} />
              <Stat label="Ed25519 checkpoints" value={v.checkpointsValid ? <Badge tone="ok">VALID</Badge> : <Badge tone="bad">INVALID</Badge>} sub={`${v.checkpoints.length} signed · key ${v.publicKeyFingerprint}`} />
              <div className="mono text-[var(--muted)]" title={v.head}>head {v.head.slice(0, 12)}…{v.head.slice(-8)}</div>
            </div>
            {v.reason ? <p className="mt-2 text-[var(--bad)]">{v.reason}</p> : null}
            <p className="mt-3 text-[13px] text-[var(--muted)]">Offline check: save the export as bundle.json, then run <code>node scripts/verify-bundle.mjs bundle.json</code>. It needs neither the API nor the database.</p>
          </Card>
        ) : null}
      </Async>

      {tamper ? (
        <Card title="Tamper demo result">
          {tamper.status === "UNAVAILABLE" ? <Banner title="UNAVAILABLE">{tamper.reason}</Banner> : (
            <>
              <div className="flex flex-wrap items-stretch gap-3">
                <Step label="Before" ok={!!tamper.before?.valid} text={tamper.before?.valid ? "PASS" : "FAIL"} />
                <Arrow />
                <Step label="During tamper" ok={!!tamper.during?.valid} text={tamper.during?.valid ? "PASS" : `FAIL @ #${tamper.during?.brokenIndex}`} />
                <Arrow />
                <Step label="Restored" ok={!!tamper.after?.valid} text={tamper.after?.valid ? "PASS" : "FAIL"} />
              </div>
              <p className="mt-4 text-[13.5px]">Mutation: <span className="mono">{tamper.mutation}</span> (event #{tamper.tamperedIndex}). <span className="text-[var(--muted)]">{tamper.during?.reason}</span></p>
            </>
          )}
        </Card>
      ) : null}

      <Card title="Anomaly feed (payloads redacted)">
        <Async loading={anomalies.loading} error={anomalies.error}>
          {(anomalies.data ?? []).length === 0 ? <p className="text-[var(--muted)]">No anomalies recorded.</p> : (
            <table>
              <thead><tr><th>Time</th><th>Kind</th><th>Severity</th><th>Tenant</th><th>Summary</th></tr></thead>
              <tbody>
                {(anomalies.data ?? []).map((a) => (
                  <tr key={a.id}><td className="whitespace-nowrap">{fmtTime(a.ts)}</td><td className="mono">{a.kind}</td><td><Badge tone={a.severity === "critical" ? "bad" : a.severity === "warning" ? "warn" : "neutral"}>{a.severity}</Badge></td><td>{a.tenant}</td><td>{a.summary}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Async>
      </Card>

      <Card title={`Latest events (${events.data?.total ?? 0} total)`}>
        <Async loading={events.loading} error={events.error}>
          <ol className="relative ml-2 border-l border-[var(--line-2)]">
            {[...(events.data?.events ?? [])].reverse().map((e) => (
              <li key={e.index} className="relative mb-3 ml-5">
                <span className="absolute -left-[26px] top-3 h-2.5 w-2.5 rounded-full bg-[var(--accent)] ring-4 ring-[var(--panel)]" aria-hidden="true" />
                <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="mono font-semibold text-[var(--accent)]">#{e.index}</span>
                    <span className="mono">{e.action}</span>
                    <span className="text-xs text-[var(--muted)]">{e.actor} · {fmtTime(e.timestamp)}</span>
                    <span className="mono ml-auto text-[var(--muted)]" title={e.currentHash}>{e.currentHash.slice(0, 8)}…{e.currentHash.slice(-6)}</span>
                  </div>
                  <div className="mt-1 text-[13.5px]">{e.payloadSummary}</div>
                </div>
              </li>
            ))}
          </ol>
        </Async>
      </Card>
    </>
  );
}
