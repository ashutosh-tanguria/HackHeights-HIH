import { getDb } from "../../repositories/db";

export type AnomalyKind =
  | "CROSS_BOUNDARY_ATTEMPT" // token for tenant X reached for a resource of tenant Y
  | "AUTH_FAILURE" // missing / forged / expired token
  | "RATE_LIMIT" // 429 from rate limit or concurrency cap
  | "PROBE_UNEXPECTED" // probe outcome differs from the expected one
  | "CHAIN_FAILURE" // audit verification failed
  | "PROVIDER_FAILURE"; // model backend unreachable

export interface Anomaly {
  id: number;
  ts: string;
  kind: AnomalyKind;
  severity: "info" | "warning" | "critical";
  tenant: string;
  summary: string;
  auditIndex: number | null;
}

/**
 * `summary` must be composed from fixed templates (tenant, resource name, status code).
 * Never pass prompt text, model output or defence-rule content here: this feed is shown to Blue and Red.
 */
export function recordAnomaly(a: Omit<Anomaly, "id" | "ts" | "auditIndex"> & { auditIndex?: number }): void {
  getDb()
    .prepare("INSERT INTO anomalies (ts,kind,severity,tenant,summary,audit_index) VALUES (?,?,?,?,?,?)")
    .run(new Date().toISOString(), a.kind, a.severity, a.tenant, a.summary, a.auditIndex ?? null);
}

export function listAnomalies(limit = 100): Anomaly[] {
  return (getDb().prepare("SELECT * FROM anomalies ORDER BY id DESC LIMIT ?").all(limit) as any[]).map((r) => ({
    id: Number(r.id),
    ts: r.ts,
    kind: r.kind,
    severity: r.severity,
    tenant: r.tenant,
    summary: r.summary,
    auditIndex: r.audit_index == null ? null : Number(r.audit_index),
  }));
}
