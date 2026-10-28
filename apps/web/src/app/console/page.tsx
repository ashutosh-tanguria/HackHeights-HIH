"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useApi } from "@/lib/api-client";
import type { Overview } from "@/lib/types";
import { Async, Badge, Banner, Card, PageHeader, SourceBadge, ci, fmtTime, num, pct } from "@/components/ui";

/** Static topology sketch of the compose file. It draws the design; the probe results next to it say whether it holds. */
function Architecture() {
  const box = { fill: "#0e1622", stroke: "#2b3b54", strokeWidth: 1.2 } as const;
  const t = { fill: "#e8eef6", fontSize: 13, fontWeight: 600 } as const;
  const s = { fill: "#93a1b5", fontSize: 10.5 } as const;
  const cross = (x: number, y: number) => (
    <g stroke="#f87171" strokeWidth="2.4" strokeLinecap="round">
      <line x1={x - 7} y1={y - 7} x2={x + 7} y2={y + 7} />
      <line x1={x - 7} y1={y + 7} x2={x + 7} y2={y - 7} />
    </g>
  );
  return (
    <svg viewBox="0 0 640 250" className="w-full" role="img" aria-label="Red and Blue each on an internal network, both reaching only the gateway, which reaches the target model">
      <rect x="6" y="14" width="150" height="86" rx="10" fill="none" stroke="#2dd4bf" strokeDasharray="4 4" opacity="0.5" />
      <text x="16" y="30" {...s}>red_net (internal)</text>
      <rect x="6" y="150" width="150" height="86" rx="10" fill="none" stroke="#2dd4bf" strokeDasharray="4 4" opacity="0.5" />
      <text x="16" y="166" {...s}>blue_net (internal)</text>
      <rect x="480" y="82" width="150" height="86" rx="10" fill="none" stroke="#2dd4bf" strokeDasharray="4 4" opacity="0.5" />
      <text x="490" y="98" {...s}>target_net (internal)</text>

      <rect x="26" y="42" width="110" height="46" rx="8" {...box} />
      <text x="81" y="63" textAnchor="middle" {...t}>Red</text>
      <text x="81" y="78" textAnchor="middle" {...s}>payloads</text>
      <rect x="26" y="178" width="110" height="46" rx="8" {...box} />
      <text x="81" y="199" textAnchor="middle" {...t}>Blue</text>
      <text x="81" y="214" textAnchor="middle" {...s}>defence logic</text>

      <rect x="250" y="94" width="130" height="62" rx="10" fill="#0b2a2a" stroke="#2dd4bf" strokeWidth="1.6" />
      <text x="315" y="120" textAnchor="middle" {...t}>Gateway</text>
      <text x="315" y="137" textAnchor="middle" {...s}>token · policy · audit</text>

      <rect x="500" y="110" width="110" height="46" rx="8" {...box} />
      <text x="555" y="131" textAnchor="middle" {...t}>Target LLM</text>
      <text x="555" y="146" textAnchor="middle" {...s}>no other route</text>

      <path d="M136 65 L250 112" stroke="#2dd4bf" strokeWidth="1.8" fill="none" />
      <path d="M136 201 L250 138" stroke="#2dd4bf" strokeWidth="1.8" fill="none" />
      <path d="M380 125 L500 130" stroke="#2dd4bf" strokeWidth="1.8" fill="none" />

      <path d="M81 88 L81 178" stroke="#f87171" strokeWidth="1.6" strokeDasharray="5 4" fill="none" />
      {cross(81, 133)}
      <text x="94" y="136" fill="#f87171" fontSize="10.5">Red ↔ Blue</text>
      <path d="M136 52 C 300 8, 450 20, 520 110" stroke="#f87171" strokeWidth="1.6" strokeDasharray="5 4" fill="none" />
      {cross(335, 30)}
      <text x="350" y="26" fill="#f87171" fontSize="10.5">Red → target direct</text>
      <path d="M136 214 C 300 245, 450 230, 530 156" stroke="#f87171" strokeWidth="1.6" strokeDasharray="5 4" fill="none" />
      {cross(335, 232)}
      <text x="350" y="246" fill="#f87171" fontSize="10.5">Blue → target direct</text>
    </svg>
  );
}

function Story({ n, word, tone, href, children }: { n: string; word: string; tone: "bad" | "accent" | "ok"; href: string; children: ReactNode }) {
  const c = { bad: "var(--bad)", accent: "var(--accent)", ok: "var(--ok)" }[tone];
  return (
    <section className="card flex flex-col rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5" style={{ borderTop: `3px solid ${c}` }}>
      <div className="label">Step {n}</div>
      <h2 className="mt-1 text-[28px] font-bold tracking-tight" style={{ color: c }}>{word}</h2>
      <div className="mt-3 flex-1">{children}</div>
      <Link href={href} className="mt-4 inline-flex w-fit items-center rounded-md border border-[var(--line-2)] px-3.5 py-2 text-[13px] font-semibold text-[var(--ink)] no-underline transition hover:bg-[var(--panel-2)]">Open →</Link>
    </section>
  );
}

const Big = ({ children, sub }: { children: ReactNode; sub?: ReactNode }) => (
  <div>
    <div className="text-[40px] font-bold leading-none tabular-nums">{children}</div>
    {sub ? <div className="mt-1.5 text-xs text-[var(--muted)] tabular-nums">{sub}</div> : null}
  </div>
);

export default function OverviewPage() {
  const { data: o, error, loading } = useApi<Overview>("/api/v1/overview", { pollMs: 10000 });
  return (
    <>
      <PageHeader title="Overview" tagline="BLOCKED, then MEASURED, then VERIFIED. Every value below comes from an API call; nothing is seeded." />
      <Async loading={loading} error={error}>
        {o ? (
          <>
            {o.service.isMock ? <Banner tone="mock" title="MOCK model">TARGET_LLM_PROVIDER=mock. Evaluation and side-channel results are labelled MOCK/SIMULATED and are not measurements.</Banner> : null}
            {!o.service.isMock && !o.service.modelReachable ? <Banner tone="bad" title="Target model UNAVAILABLE">{o.service.modelReason}</Banner> : null}
            {o.service.ephemeralSecrets.length ? <Banner title="Ephemeral secrets">The API generated random secrets for {o.service.ephemeralSecrets.join(", ")}; they change on restart. Run `pnpm setup`.</Banner> : null}

            <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Story n="1" word="BLOCKED" tone="bad" href="/console/probes">
                <div className="label mb-2">Container and network isolation</div>
                {!o.probes ? (
                  <p className="text-[var(--muted)]">No probe run yet. Start the stack, then run the probes.</p>
                ) : o.probes.status === "UNAVAILABLE" ? (
                  <><Badge tone="bad">UNAVAILABLE</Badge><p className="mt-2 text-[13px] text-[var(--muted)]">{o.probes.reason}</p></>
                ) : (
                  <Big sub={`${o.probes.failed} unexpected · ${o.probes.inconclusive} inconclusive · ${fmtTime(o.probes.finishedAt)}`}>
                    {o.probes.passed}<span className="text-[var(--muted)]">/{o.probes.total}</span> <span className="text-base font-medium text-[var(--muted)]">as expected</span>
                  </Big>
                )}
              </Story>

              <Story n="2" word="MEASURED" tone="accent" href="/console/evaluation">
                <div className="label mb-2">Defence effect (Blue off vs on)</div>
                {o.evaluation ? (
                  <>
                    <Big sub={`${pct(o.evaluation.asrBefore.rate)} → ${pct(o.evaluation.asrAfter.rate)} attack success · n=${o.evaluation.nAdversarial}`}>
                      {pct(o.evaluation.relativeReduction)} <span className="text-base font-medium text-[var(--muted)]">relative reduction</span>
                    </Big>
                    <div className="mt-2 flex flex-wrap items-center gap-2"><SourceBadge source={o.evaluation.claimLevel} /><span className="mono text-[var(--muted)]">{o.evaluation.model}</span></div>
                  </>
                ) : (
                  <p className="text-[var(--muted)]">No completed evaluation yet. {o.lastEvaluationStatus ? `Last run ${o.lastEvaluationStatus.status}${o.lastEvaluationStatus.error ? `: ${o.lastEvaluationStatus.error}` : ""}.` : ""}</p>
                )}
              </Story>

              <Story n="3" word="VERIFIED" tone="ok" href="/console/audit">
                <div className="label mb-2">Tamper-evident audit chain</div>
                <Big sub={`${o.audit.totalEvents} events · signed checkpoints ${o.audit.checkpointsValid ? "valid" : "INVALID"}`}>
                  {o.audit.isValid ? <span className="text-[var(--ok)]">PASS</span> : <span className="text-[var(--bad)]">FAIL @ #{o.audit.brokenIndex}</span>}
                </Big>
                <div className="mono mt-2 break-all text-[var(--muted)]">head {o.audit.head.slice(0, 16)}…</div>
              </Story>
            </div>

            <Card title="Topology: where communication is allowed" right={<span className="text-xs text-[var(--muted)]">design drawing; the probes test it</span>}>
              <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <Architecture />
                <p className="text-[14px] leading-relaxed text-[var(--muted)]">Red and Blue each live on their own internal network and can only reach the Gateway. The Gateway is the single bridge to the target model. Dashed red paths are the routes the isolation probes try, and must be refused. <span className="text-[var(--ink)]">Communication is allowed; observation is not.</span></p>
              </div>
            </Card>

            <Card title="Timing side channel">
              {o.sideChannel.length === 0 ? (
                <p className="text-[var(--muted)]">No side-channel run yet.</p>
              ) : (
                <table>
                  <thead><tr><th>Mode</th><th>AUC (busy vs idle)</th><th>95% CI</th><th>n idle/busy</th><th>Source</th></tr></thead>
                  <tbody>
                    {o.sideChannel.map((s) => (
                      <tr key={s.mode}>
                        <td>{s.mode}</td>
                        <td className="tabular-nums">{num(s.auc)}</td>
                        <td className="tabular-nums">{ci(s.aucCi95, (x) => x.toFixed(3))}</td>
                        <td className="tabular-nums">{s.nIdle}/{s.nBusy}</td>
                        <td><SourceBadge source={s.source} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Recent anomalies">
              {o.anomalies.length === 0 ? <p className="text-[var(--muted)]">None recorded.</p> : (
                <ul className="space-y-2">
                  {o.anomalies.map((a) => (
                    <li key={a.id}><Badge tone={a.severity === "critical" ? "bad" : a.severity === "warning" ? "warn" : "neutral"}>{a.kind}</Badge> <span className="text-[var(--muted)]">{fmtTime(a.ts)}</span> {a.summary}</li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        ) : null}
      </Async>
    </>
  );
}
