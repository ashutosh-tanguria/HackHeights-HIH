"use client";
import { useState } from "react";
import { api } from "@/lib/api-client";
import type { AccessCheck } from "@/lib/types";
import { Badge, Banner, Button, Card, PageHeader, Stat } from "@/components/ui";

interface Minted {
  token: string;
  claims: { tenant: string; evaluationId: string; capabilities: string[]; scope: string[]; blue: boolean; exp: number; iat: number; jti: string };
}

export default function AccessPage() {
  const [checks, setChecks] = useState<{ passed: number; total: number; checks: AccessCheck[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tenant, setTenant] = useState<"red" | "blue">("red");
  const [minted, setMinted] = useState<Minted | null>(null);

  async function selftest() {
    setBusy(true);
    setErr(null);
    const r = await api<{ passed: number; total: number; checks: AccessCheck[] }>("/api/v1/access/selftest", { method: "POST" });
    if (r.ok) setChecks(r.data);
    else setErr(r.error);
    setBusy(false);
  }
  async function mint() {
    setErr(null);
    const r = await api<Minted>("/api/v1/tokens", { method: "POST", body: { tenant, ttlSeconds: 300 } });
    if (r.ok) setMinted(r.data);
    else setErr(r.error);
  }

  return (
    <>
      <PageHeader title="Access control" tagline="Signed, short-lived capability tokens scoped by tenant and resource. The tenant is read from the token, never from the request.">
        <Button onClick={selftest} disabled={busy}>{busy ? "Running…" : "Run live self-test"}</Button>
      </PageHeader>
      {err ? <Banner tone="bad" title="Request failed">{err}</Banner> : null}

      <Card title="Live self-test">
        {!checks ? <p className="text-[var(--muted)]">Sends real requests to the gateway with forged, expired, mis-scoped and valid tokens, and records the status codes it actually returns. Denials are written to the audit chain.</p> : (
          <>
            <div className="mb-3"><Stat label="As expected" value={`${checks.passed}/${checks.total}`} /></div>
            <table>
              <thead><tr><th>Check</th><th>Request</th><th>Expected</th><th>Got</th><th>Result</th></tr></thead>
              <tbody>
                {checks.checks.map((c) => (
                  <tr key={c.name}><td>{c.name}</td><td className="mono">{c.request}</td><td className="mono">{c.expectedStatus}</td><td className="mono">{c.gotStatus}</td><td>{c.passed ? <Badge tone="ok">{c.expectedStatus >= 400 ? "BLOCKED" : "ALLOWED"}</Badge> : <Badge tone="bad">UNEXPECTED</Badge>}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>

      <Card title="Mint a token (admin)" right={<><select value={tenant} onChange={(e) => setTenant(e.target.value as "red" | "blue")} className="rounded border border-[var(--line)] px-1 py-1"><option value="red">red</option><option value="blue">blue</option></select><Button onClick={mint}>Mint 5-minute token</Button></>}>
        {!minted ? <p className="text-[var(--muted)]">Tokens are HMAC-signed claims: tenant, evaluation id, capabilities, resource scope, expiry, and whether the Blue defence applies.</p> : (
          <dl className="grid grid-cols-[150px_1fr] gap-y-1 text-[13px]">
            <dt className="text-[var(--muted)]">tenant</dt><dd>{minted.claims.tenant}</dd>
            <dt className="text-[var(--muted)]">capabilities</dt><dd className="mono">{minted.claims.capabilities.join(", ")}</dd>
            <dt className="text-[var(--muted)]">resource scope</dt><dd className="mono">{minted.claims.scope.join(", ")}</dd>
            <dt className="text-[var(--muted)]">Blue defence applied</dt><dd>{String(minted.claims.blue)}</dd>
            <dt className="text-[var(--muted)]">expires</dt><dd>{new Date(minted.claims.exp * 1000).toLocaleTimeString()}</dd>
            <dt className="text-[var(--muted)]">token</dt><dd className="mono break-all">{minted.token}</dd>
          </dl>
        )}
      </Card>
    </>
  );
}
