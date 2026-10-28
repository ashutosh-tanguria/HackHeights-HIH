"use client";
import { useApi } from "@/lib/api-client";
import type { ThreatRow } from "@/lib/types";
import { Async, Badge, Banner, Card, PageHeader } from "@/components/ui";

const TONE = { VERIFIED: "ok", UNVERIFIED: "warn", SIMULATED: "mock", PLANNED: "neutral", NOT_PROTECTED: "bad" } as const;

export default function ThreatModelPage() {
  const { data, error, loading } = useApi<ThreatRow[]>("/api/v1/threat-model", { pollMs: 15000 });
  return (
    <>
      <PageHeader title="Threat model and residual risk" tagline="Status is derived live from stored evidence. Likelihood and impact are the authors' estimates, not measurements." />
      <Banner tone="warn" title="How to read this">
        VERIFIED = a stored, reproducible result supports it. UNVERIFIED = implemented, but the verifying command has not been run on this install. Residual risk = likelihood × impact (1–5 each), ASSESSED by the authors after assuming the mitigation works.
      </Banner>
      <Async loading={loading} error={error}>
        <Card>
          <table>
            <thead><tr><th>ID</th><th>Threat</th><th>Mitigation</th><th>Status</th><th>Evidence</th><th title="ASSESSED, not measured">L×I (assessed)</th></tr></thead>
            <tbody>
              {(data ?? []).map((t) => (
                <tr key={t.id}>
                  <td className="mono">{t.id}</td>
                  <td><div className="font-semibold">{t.threat}</div><div className="text-xs text-[var(--muted)]">{t.vertical}</div></td>
                  <td>{t.mitigation}</td>
                  <td><Badge tone={TONE[t.status]}>{t.status.replace("_", " ")}</Badge></td>
                  <td><div>{t.evidence}</div><div className="mono mt-1 text-[var(--muted)]">verify: {t.verifyCommand}</div><div className="mt-1 text-xs text-[var(--muted)]">Residual: {t.residualNote}</div></td>
                  <td className="whitespace-nowrap tabular-nums">{t.likelihood}×{t.impact} = <b>{t.residualRisk}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Async>
    </>
  );
}
