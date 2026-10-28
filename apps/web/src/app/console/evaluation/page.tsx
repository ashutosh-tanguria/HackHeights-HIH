"use client";
import { useEffect, useState } from "react";
import { api, useApi } from "@/lib/api-client";
import type { EvalRow, Evaluation } from "@/lib/types";
import { Async, Badge, Banner, Button, Card, PageHeader, SourceBadge, Kpi, ci, fmtTime, pct } from "@/components/ui";

type R = { rate: number | null; n: number; ci95: [number, number] | null };
function BarChart({ groups }: { groups: Array<{ name: string; bars: Array<{ label: string; r: R; color: string }> }> }) {
  const W = 520, H = 230, L = 40, B = 40, T = 10, ph = H - B - T;
  const y = (v: number) => T + ph * (1 - Math.min(1, Math.max(0, v)));
  const gw = (W - L - 10) / groups.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Rates with 95% Wilson intervals">
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}><line x1={L} x2={W - 10} y1={y(g)} y2={y(g)} stroke="#1f2c3f" /><text x={L - 6} y={y(g) + 4} textAnchor="end" fontSize="10" fill="#93a1b5">{Math.round(g * 100)}%</text></g>
      ))}
      {groups.map((g, gi) => (
        <g key={g.name}>
          {g.bars.map((b, bi) => {
            const bw = 56, x = L + gi * gw + gw / 2 - bw - 6 + bi * (bw + 12), v = b.r.rate ?? 0;
            return (
              <g key={b.label}>
                <rect x={x} y={y(v)} width={bw} height={Math.max(1, y(0) - y(v))} rx="3" fill={b.color} opacity="0.9" />
                {b.r.ci95 ? <g stroke="#e8eef6" strokeWidth="1.6"><line x1={x + bw / 2} x2={x + bw / 2} y1={y(b.r.ci95[0])} y2={y(b.r.ci95[1])} /><line x1={x + bw / 2 - 6} x2={x + bw / 2 + 6} y1={y(b.r.ci95[0])} y2={y(b.r.ci95[0])} /><line x1={x + bw / 2 - 6} x2={x + bw / 2 + 6} y1={y(b.r.ci95[1])} y2={y(b.r.ci95[1])} /></g> : null}
                <text x={x + bw / 2} y={H - 22} textAnchor="middle" fontSize="11" fill="#e8eef6">{b.label}</text>
              </g>
            );
          })}
          <text x={L + gi * gw + gw / 2} y={H - 5} textAnchor="middle" fontSize="11" fill="#93a1b5">{g.name}</text>
        </g>
      ))}
    </svg>
  );
}

export default function EvaluationPage() {
  const list = useApi<Evaluation[]>("/api/v1/evaluations", { pollMs: 4000 });
  const [maxAdv, setMaxAdv] = useState(30);
  const [maxBen, setMaxBen] = useState(10);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [showRows, setShowRows] = useState(false);

  const latest = list.data?.[0] ?? null;
  const done = list.data?.find((e) => e.summary) ?? null;
  const detail = useApi<Evaluation>(latest ? `/api/v1/evaluations/${latest.id}` : null, { pollMs: latest?.status === "running" ? 2000 : undefined });
  const rows = useApi<EvalRow[]>(showRows && done ? `/api/v1/evaluations/${done.id}/rows` : null);
  const running = latest?.status === "running";

  // When a run stops, reload the list so the finished summary appears.
  const detailStatus = detail.data?.status;
  const refreshList = list.refresh;
  useEffect(() => {
    if (detailStatus && detailStatus !== "running") void refreshList();
  }, [detailStatus, refreshList]);

  async function start() {
    setStarting(true);
    setStartError(null);
    const r = await api<{ id: string }>("/api/v1/evaluations/run", { method: "POST", body: { maxAdversarial: maxAdv, maxBenign: maxBen } });
    if (!r.ok) setStartError(`${r.status === 502 ? "Target model UNAVAILABLE (HTTP 502): " : ""}${r.error}`);
    setStarting(false);
    void list.refresh();
  }
  async function cancel() {
    if (latest) await api(`/api/v1/evaluations/${latest.id}/cancel`, { method: "POST" });
    void list.refresh();
  }

  const s = done?.summary ?? null;
  const progress = detail.data?.progress;
  return (
    <>
      <PageHeader title="Evaluation" tagline="Same prompts sent through the gateway twice: Blue defence off (before), Blue defence on (after). Defence state is a claim in the signed token.">
        <label className="text-xs text-[var(--muted)]">Adversarial n <input type="number" min={1} max={120} value={maxAdv} onChange={(e) => setMaxAdv(+e.target.value)} className="ml-1 w-16 rounded border border-[var(--line)] px-1" /></label>
        <label className="text-xs text-[var(--muted)]">Benign n <input type="number" min={0} max={20} value={maxBen} onChange={(e) => setMaxBen(+e.target.value)} className="ml-1 w-16 rounded border border-[var(--line)] px-1" /></label>
        <Button onClick={start} disabled={starting || running}>{running ? "Running…" : "Run evaluation"}</Button>
        {running ? <Button kind="ghost" onClick={cancel}>Cancel</Button> : null}
      </PageHeader>
      {startError ? <Banner tone="bad" title="Evaluation not started">{startError}</Banner> : null}
      <Async loading={list.loading} error={list.error}>
        {running ? <Banner tone="ok" title="Evaluation running">{progress ? `${progress.done}/${progress.total} gateway calls done` : "starting…"} (each case is sent twice)</Banner> : null}
        {latest && latest.status === "failed" ? <Banner tone="bad" title={`Last evaluation failed (${latest.id})`}>{latest.error}</Banner> : null}
        {latest && latest.status === "cancelled" ? <Banner title="Last evaluation cancelled">{latest.error}</Banner> : null}
        {!s ? <p className="text-[var(--muted)]">No completed evaluation yet.</p> : (
          <>
            {s.isMock ? <Banner tone="mock" title="MOCK model: these numbers are not a measurement">The target is the offline mock stub. Use TARGET_LLM_PROVIDER=ollama for a MEASURED result.</Banner> : null}
            <Card title={`Result ${s.id}`} right={<SourceBadge source={s.claimLevel} />}>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Attack success, Blue OFF" tone="bad" value={pct(s.asrBefore.rate)} sub={`${s.asrBefore.successes}/${s.asrBefore.n} · 95% Wilson ${ci(s.asrBefore.ci95, (x) => pct(x, 0))}`} />
                <Kpi label="Attack success, Blue ON" tone="ok" value={pct(s.asrAfter.rate)} sub={`${s.asrAfter.successes}/${s.asrAfter.n} · 95% Wilson ${ci(s.asrAfter.ci95, (x) => pct(x, 0))}`} />
                <Kpi label="Relative reduction" tone="accent" value={pct(s.relativeReduction)} />
                <Kpi label="False refusal, Blue ON" value={pct(s.falseRefusalAfter.rate)} sub={`${s.falseRefusalAfter.successes}/${s.falseRefusalAfter.n} benign · ${ci(s.falseRefusalAfter.ci95, (x) => pct(x, 0))}`} />
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <BarChart groups={[
                  { name: "Attack success", bars: [{ label: "Blue off", r: s.asrBefore, color: "#f87171" }, { label: "Blue on", r: s.asrAfter, color: "#2dd4bf" }] },
                  { name: "Benign false refusal", bars: [{ label: "Blue off", r: s.falseRefusalBefore, color: "#fbbf24" }, { label: "Blue on", r: s.falseRefusalAfter, color: "#60a5fa" }] },
                ]} />
                <p className="self-center text-[13px] text-[var(--muted)]">Bars are the observed rates; whiskers are the 95% Wilson intervals computed by the API from the same counts. False refusal, Blue OFF: {s.falseRefusalBefore.successes}/{s.falseRefusalBefore.n} benign. Overlapping whiskers mean the difference is not established at this n.</p>
              </div>
              <dl className="mt-4 grid grid-cols-[170px_1fr] gap-y-1 text-[13px]">
                <dt className="text-[var(--muted)]">Model / provider</dt><dd className="mono">{s.model} / {s.provider}</dd>
                <dt className="text-[var(--muted)]">Blue executed</dt><dd>{s.blueExecution ?? "n/a"}</dd>
                <dt className="text-[var(--muted)]">Refusal detection</dt><dd>{s.refusalDetection}</dd>
                <dt className="text-[var(--muted)]">Manifest SHA-256</dt><dd className="mono break-all">{s.manifestSha256}</dd>
                <dt className="text-[var(--muted)]">Rows SHA-256</dt><dd className="mono break-all">{s.rowsSha256}</dd>
                <dt className="text-[var(--muted)]">Rejected manifest rows</dt><dd>{s.manifestRejectedRows.length ? s.manifestRejectedRows.join(", ") : "none (every prompt hash recomputed OK)"}</dd>
                <dt className="text-[var(--muted)]">Completed</dt><dd>{fmtTime(s.completedAt)}</dd>
              </dl>
            </Card>
            <Card title="Per-prompt rows" right={<Button kind="ghost" onClick={() => setShowRows((v) => !v)}>{showRows ? "Hide" : "Show"}</Button>}>
              {!showRows ? <p className="text-[var(--muted)]">Rows are persisted in SQLite and hash-bound to the audit chain. Prompt text is not stored in rows; use the case id.</p> : (
                <Async loading={rows.loading} error={rows.error}>
                  <table>
                    <thead><tr><th>Case</th><th>Dataset</th><th>Stage</th><th>Outcome</th><th>Reply (first 160 chars)</th></tr></thead>
                    <tbody>
                      {(rows.data ?? []).map((r) => (
                        <tr key={`${r.caseId}-${r.stage}`}>
                          <td className="mono">{r.caseId}</td><td>{r.dataset}</td><td>{r.stage === "before" ? "Blue off" : "Blue on"}</td>
                          <td>{r.expected === "refuse" ? (r.attackSuccess ? <Badge tone="bad">ATTACK SUCCEEDED</Badge> : <Badge tone="ok">{r.blockedBy ? "BLOCKED BY DEFENCE" : "MODEL REFUSED"}</Badge>) : (r.falseRefusal ? <Badge tone="warn">FALSE REFUSAL</Badge> : <Badge tone="ok">ANSWERED</Badge>)}</td>
                          <td className="text-[var(--muted)]">{r.responseSnippet}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Async>
              )}
            </Card>
          </>
        )}
      </Async>
    </>
  );
}
