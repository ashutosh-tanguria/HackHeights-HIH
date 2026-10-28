import { execFile } from "child_process";
import { randomBytes } from "crypto";
import { env } from "../../config/env";
import { getDb } from "../../repositories/db";
import { auditService } from "../audit/audit-service";
import { recordAnomaly } from "./anomalies";

export type Observed = "DENIED" | "REACHED" | "ERROR";

export interface ProbeDef {
  id: string;
  title: string;
  category: "network" | "dns" | "egress" | "filesystem" | "privilege" | "access-control" | "positive-control";
  container: "red" | "blue";
  /** Arguments after `probe <id>` inside the container. */
  args: (ctx: ProbeContext) => string[];
  expect: "DENIED" | "REACHED";
}

export interface ProbeContext {
  ips: { red: string[]; blue: string[]; target: string[] };
}

export interface ProbeEvidence {
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface ProbeResult {
  id: string;
  title: string;
  category: ProbeDef["category"];
  container: string;
  expect: ProbeDef["expect"];
  observed: Observed;
  /** BLOCKED is shown to humans only when a DENIED outcome was expected AND observed. */
  passed: boolean;
  detail: string;
  evidence: ProbeEvidence;
  ts: string;
}

export interface ProbeRun {
  id: string;
  status: "EXECUTED" | "UNAVAILABLE";
  reason?: string;
  startedAt: string;
  finishedAt: string;
  total: number;
  passed: number;
  failed: number;
  inconclusive: number;
  results: ProbeResult[];
}

export type ExecFn = (file: string, args: string[], timeoutMs: number) => Promise<{ code: number | null; stdout: string; stderr: string }>;

export const defaultExec: ExecFn = (file, args, timeoutMs) =>
  new Promise((resolve, reject) => {
    execFile(file, args, { timeout: timeoutMs, windowsHide: true, maxBuffer: 1024 * 256 }, (err, stdout, stderr) => {
      if (err && (err as NodeJS.ErrnoException).code === "ENOENT") return reject(err);
      const code = err ? (typeof (err as any).code === "number" ? ((err as any).code as number) : null) : 0;
      resolve({ code, stdout: String(stdout), stderr: String(stderr) });
    });
  });

const csv = (xs: string[]) => (xs.length ? xs.join(",") : "-");

export const PROBES: ProbeDef[] = [
  { id: "red-to-blue", title: "Red connects to Blue (by name and by IP)", category: "network", container: "red", expect: "DENIED", args: (c) => ["--host", "blue", "--port", "8081", "--ips", csv(c.ips.blue)] },
  { id: "blue-to-red", title: "Blue connects to Red (by name and by IP)", category: "network", container: "blue", expect: "DENIED", args: (c) => ["--host", "red", "--port", "8080", "--ips", csv(c.ips.red)] },
  { id: "red-to-target", title: "Red connects to Target model directly, bypassing the gateway", category: "network", container: "red", expect: "DENIED", args: (c) => ["--host", "target", "--port", "11434", "--ips", csv(c.ips.target)] },
  { id: "blue-to-target", title: "Blue connects to Target model directly, bypassing the gateway", category: "network", container: "blue", expect: "DENIED", args: (c) => ["--host", "target", "--port", "11434", "--ips", csv(c.ips.target)] },
  { id: "red-dns-blue", title: "Red resolves Blue's hostname", category: "dns", container: "red", expect: "DENIED", args: () => ["--names", "blue,bayora-blue,target"] },
  { id: "blue-dns-red", title: "Blue resolves Red's hostname", category: "dns", container: "blue", expect: "DENIED", args: () => ["--names", "red,bayora-red,target"] },
  { id: "red-egress", title: "Red reaches the public internet", category: "egress", container: "red", expect: "DENIED", args: () => ["--targets", "1.1.1.1:443,8.8.8.8:53"] },
  { id: "blue-egress", title: "Blue reaches the public internet", category: "egress", container: "blue", expect: "DENIED", args: () => ["--targets", "1.1.1.1:443,8.8.8.8:53"] },
  { id: "red-reads-blue-secret", title: "Red reads Blue's secret volume (/secrets/defense.key)", category: "filesystem", container: "red", expect: "DENIED", args: () => ["--path", "/secrets/defense.key"] },
  { id: "blue-reads-red-payloads", title: "Blue reads Red's payload volume (/payloads/corpus.txt)", category: "filesystem", container: "blue", expect: "DENIED", args: () => ["--path", "/payloads/corpus.txt"] },
  { id: "blue-reads-own-secret", title: "Control: Blue reads its own secret volume", category: "positive-control", container: "blue", expect: "REACHED", args: () => ["--path", "/secrets/defense.key"] },
  { id: "red-reads-own-payloads", title: "Control: Red reads its own payload volume", category: "positive-control", container: "red", expect: "REACHED", args: () => ["--path", "/payloads/corpus.txt"] },
  { id: "red-rootfs-write", title: "Red writes to its root filesystem", category: "filesystem", container: "red", expect: "DENIED", args: () => ["--path", "/etc/bayora-probe"] },
  { id: "blue-rootfs-write", title: "Blue writes to its root filesystem", category: "filesystem", container: "blue", expect: "DENIED", args: () => ["--path", "/etc/bayora-probe"] },
  { id: "red-privileges", title: "Red holds Linux capabilities or root (CapEff, uid, NoNewPrivs)", category: "privilege", container: "red", expect: "DENIED", args: () => [] },
  { id: "blue-privileges", title: "Blue holds Linux capabilities or root (CapEff, uid, NoNewPrivs)", category: "privilege", container: "blue", expect: "DENIED", args: () => [] },
  { id: "red-docker-socket", title: "Red can see the Docker socket", category: "privilege", container: "red", expect: "DENIED", args: () => ["--path", "/var/run/docker.sock"] },
  { id: "red-defense-config", title: "Red asks the gateway for Blue's defence config with its own token", category: "access-control", container: "red", expect: "DENIED", args: () => [] },
  { id: "red-gateway-control", title: "Control: Red enrols and calls the gateway with its token", category: "positive-control", container: "red", expect: "REACHED", args: () => [] },
  { id: "blue-gateway-control", title: "Control: Blue enrols and calls the gateway with its token", category: "positive-control", container: "blue", expect: "REACHED", args: () => [] },
  { id: "red-inference-control", title: "Control: Red gets a completion from the model through the gateway", category: "positive-control", container: "red", expect: "REACHED", args: () => [] },
];

const containerName = (c: "red" | "blue") => (c === "red" ? env.RED_CONTAINER : env.BLUE_CONTAINER);

export class IsolationService {
  constructor(private readonly exec: ExecFn = defaultExec) {}

  private async preflight(): Promise<{ ok: true; ctx: ProbeContext } | { ok: false; reason: string }> {
    try {
      const v = await this.exec(env.DOCKER_BIN, ["version", "--format", "{{.Server.Version}}"], 8000);
      if (v.code !== 0) return { ok: false, reason: `Docker daemon not reachable (exit ${v.code}): ${v.stderr.trim().slice(0, 200) || "no output"}` };
    } catch (e: any) {
      return { ok: false, reason: `Docker CLI not available: ${e?.message ?? e}` };
    }
    const ips: ProbeContext["ips"] = { red: [], blue: [], target: [] };
    for (const [key, name] of [["red", env.RED_CONTAINER], ["blue", env.BLUE_CONTAINER], ["target", env.TARGET_CONTAINER]] as const) {
      const r = await this.exec(env.DOCKER_BIN, ["inspect", "-f", "{{.State.Running}} {{json .NetworkSettings.Networks}}", name], 8000);
      if (r.code !== 0 || !r.stdout.startsWith("true")) {
        return { ok: false, reason: `Container '${name}' is not running. Start the stack with: docker compose up -d` };
      }
      try {
        const nets = JSON.parse(r.stdout.slice(5)) as Record<string, { IPAddress?: string }>;
        ips[key] = Object.values(nets).map((n) => n.IPAddress ?? "").filter(Boolean);
      } catch {
        /* IP probes degrade to name-only; recorded in evidence */
      }
    }
    return { ok: true, ctx: { ips } };
  }

  public async runAll(): Promise<ProbeRun> {
    const startedAt = new Date().toISOString();
    const id = `probe-${Date.now().toString(36)}-${randomBytes(2).toString("hex")}`;
    const pre = await this.preflight();
    if (!pre.ok) {
      const run: ProbeRun = { id, status: "UNAVAILABLE", reason: pre.reason, startedAt, finishedAt: new Date().toISOString(), total: 0, passed: 0, failed: 0, inconclusive: 0, results: [] };
      this.persist(run);
      return run;
    }
    const results: ProbeResult[] = [];
    for (const def of PROBES) {
      results.push(await this.runOne(def, pre.ctx));
    }
    const run: ProbeRun = {
      id,
      status: "EXECUTED",
      startedAt,
      finishedAt: new Date().toISOString(),
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed && r.observed !== "ERROR").length,
      inconclusive: results.filter((r) => r.observed === "ERROR").length,
      results,
    };
    this.persist(run);
    return run;
  }

  private async runOne(def: ProbeDef, ctx: ProbeContext): Promise<ProbeResult> {
    const container = containerName(def.container);
    const args = ["exec", container, "node", "/app/runner.mjs", "probe", def.id, ...def.args(ctx)];
    const t0 = Date.now();
    let code: number | null = null;
    let stdout = "";
    let stderr = "";
    try {
      const r = await this.exec(env.DOCKER_BIN, args, 45000);
      ({ code, stdout, stderr } = r);
    } catch (e: any) {
      stderr = String(e?.message ?? e);
    }
    let observed: Observed = "ERROR";
    let detail = "runner produced no parseable result";
    const line = stdout.trim().split("\n").filter(Boolean).pop();
    if (line) {
      try {
        const j = JSON.parse(line) as { outcome?: string; detail?: string };
        if (j.outcome === "DENIED" || j.outcome === "REACHED" || j.outcome === "ERROR") observed = j.outcome;
        detail = j.detail ?? detail;
      } catch {
        /* stays ERROR */
      }
    }
    return {
      id: def.id,
      title: def.title,
      category: def.category,
      container,
      expect: def.expect,
      observed,
      passed: observed === def.expect,
      detail,
      evidence: { command: `${env.DOCKER_BIN} ${args.join(" ")}`, exitCode: code, stdout: stdout.trim().slice(0, 700), stderr: stderr.trim().slice(0, 300), durationMs: Date.now() - t0 },
      ts: new Date().toISOString(),
    };
  }

  private persist(run: ProbeRun): void {
    const db = getDb();
    db.prepare("INSERT INTO probe_runs (id,status,reason,started_at,finished_at,summary) VALUES (?,?,?,?,?,?)").run(
      run.id,
      run.status,
      run.reason ?? null,
      run.startedAt,
      run.finishedAt,
      JSON.stringify({ total: run.total, passed: run.passed, failed: run.failed, inconclusive: run.inconclusive }),
    );
    for (const r of run.results) db.prepare("INSERT INTO probe_results (run_id,probe_id,json) VALUES (?,?,?)").run(run.id, r.id, JSON.stringify(r));
    const ev = auditService().append({
      evaluationId: run.id,
      actor: "orchestrator",
      action: "PROBE_RUN",
      targetResource: "sandbox/isolation",
      // Raw evidence goes into the hash chain so the result cannot be edited afterwards.
      payload: { status: run.status, reason: run.reason, total: run.total, passed: run.passed, failed: run.failed, inconclusive: run.inconclusive, results: run.results.map((r) => ({ id: r.id, expect: r.expect, observed: r.observed, passed: r.passed, evidence: r.evidence })) },
      summary: run.status === "UNAVAILABLE" ? `Isolation probes UNAVAILABLE: ${run.reason}` : `Isolation probes: ${run.passed}/${run.total} as expected, ${run.failed} unexpected, ${run.inconclusive} inconclusive.`,
    });
    for (const r of run.results.filter((x) => !x.passed)) {
      recordAnomaly({
        kind: "PROBE_UNEXPECTED",
        severity: r.observed === "ERROR" ? "warning" : "critical",
        tenant: r.container === env.RED_CONTAINER ? "red" : "blue",
        summary: `Probe '${r.id}' expected ${r.expect} but observed ${r.observed}.`,
        auditIndex: ev.index,
      });
    }
  }

  public latest(): ProbeRun | null {
    const db = getDb();
    const r = db.prepare("SELECT * FROM probe_runs ORDER BY started_at DESC LIMIT 1").get() as any;
    if (!r) return null;
    const results = (db.prepare("SELECT json FROM probe_results WHERE run_id = ?").all(r.id) as any[]).map((x) => JSON.parse(x.json) as ProbeResult);
    const order = new Map(PROBES.map((p, i) => [p.id, i]));
    results.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    const s = JSON.parse(r.summary);
    return { id: r.id, status: r.status, reason: r.reason ?? undefined, startedAt: r.started_at, finishedAt: r.finished_at, total: s.total, passed: s.passed, failed: s.failed, inconclusive: s.inconclusive, results };
  }
}
