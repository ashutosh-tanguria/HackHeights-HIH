/**
 * Bayora end-to-end demo:  pnpm demo
 * Talks to a running API (docker compose up, or `pnpm dev`). Every line printed is an API response; nothing is canned.
 * Steps that cannot run print UNAVAILABLE with the API's reason and the demo continues.
 *
 *   DEMO_ADV (default 20)       adversarial prompts in the evaluation
 *   DEMO_BENIGN (default 6)     benign prompts
 *   DEMO_SAMPLES (default 12)   side-channel samples per Blue state, per mode
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd(); // `pnpm demo` runs from the repository root

function envFromFile(): Record<string, string> {
  const f = resolve(root, ".env");
  if (!existsSync(f)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(f, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}
const fileEnv = envFromFile();
const API = process.env.BAYORA_API_URL ?? fileEnv.BAYORA_API_URL ?? "http://localhost:4000";
const KEY = process.env.BAYORA_ADMIN_KEY ?? fileEnv.BAYORA_ADMIN_KEY ?? "";

async function call<T = any>(path: string, method: "GET" | "POST" = "GET", body?: unknown): Promise<{ status: number; data: T }> {
  const r = await fetch(`${API}${path}`, { method, headers: { "x-bayora-admin-key": KEY, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  let data: any = text;
  try { data = JSON.parse(text); } catch { /* keep text */ }
  return { status: r.status, data };
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const h = (t: string) => console.log(`\n${"=".repeat(78)}\n${t}\n${"=".repeat(78)}`);
const pct = (x: number | null) => (x === null || x === undefined ? "n/a" : `${(x * 100).toFixed(1)}%`);
const ci = (c: [number, number] | null) => (c ? `[${pct(c[0])}, ${pct(c[1])}]` : "n/a");

async function main() {
  console.log("Bayora demo. Hack in Hills, powered by TinyFish.");
  console.log(`API: ${API}`);
  if (!KEY) { console.error("BAYORA_ADMIN_KEY missing. Run `pnpm setup` first."); process.exit(1); }

  const health = await fetch(`${API}/health`).then((r) => r.json()).catch(() => null);
  if (!health) { console.error(`Cannot reach ${API}. Start the stack (README) and retry.`); process.exit(1); }
  console.log(`model=${health.model} provider=${health.provider} ${health.isMock ? "[MOCK: results below are NOT measurements]" : "[real model]"} blue=${health.blueFilterMode}`);

  // ---------------------------------------------------------------- BLOCKED
  h("1. BLOCKED  real isolation probes (docker exec inside red and blue)");
  const probes = await call("/api/v1/probes/run", "POST");
  if (probes.data.status !== "EXECUTED") {
    console.log(`UNAVAILABLE: ${probes.data.reason ?? JSON.stringify(probes.data)}`);
  } else {
    for (const p of probes.data.results) {
      const verdict = p.observed === "ERROR" ? "INCONCLUSIVE" : p.expect === "DENIED" ? (p.passed ? "BLOCKED" : "LEAKED") : (p.passed ? "ALLOWED (control)" : "BROKEN (control)");
      console.log(`${verdict.padEnd(18)} ${p.container.padEnd(12)} ${p.title}\n${" ".repeat(31)}${p.detail}`);
    }
    console.log(`\nAs expected: ${probes.data.passed}/${probes.data.total}; unexpected ${probes.data.failed}; inconclusive ${probes.data.inconclusive}`);
  }

  // ---------------------------------------------------------------- MEASURED
  h("2a. MEASURED  evaluation, Blue off vs Blue on, through the gateway");
  const adv = Number(process.env.DEMO_ADV ?? 20);
  const ben = Number(process.env.DEMO_BENIGN ?? 6);
  const start = await call("/api/v1/evaluations/run", "POST", { maxAdversarial: adv, maxBenign: ben });
  if (start.status !== 202) {
    console.log(`UNAVAILABLE (HTTP ${start.status}): ${start.data?.error?.message ?? JSON.stringify(start.data)}`);
  } else {
    const id = start.data.id as string;
    let ev: any;
    for (;;) {
      ev = (await call(`/api/v1/evaluations/${id}`)).data;
      if (ev.progress) process.stdout.write(`\r  ${ev.progress.done}/${ev.progress.total} gateway calls   `);
      if (ev.status !== "running") break;
      await sleep(2000);
    }
    console.log();
    if (ev.status !== "completed") console.log(`Evaluation ${ev.status}: ${ev.error}`);
    else {
      const s = ev.summary;
      console.log(`[${s.claimLevel}] model=${s.model} provider=${s.provider} blue executed ${s.blueExecution}`);
      console.log(`ASR Blue OFF : ${pct(s.asrBefore.rate)}  (${s.asrBefore.successes}/${s.asrBefore.n}, 95% Wilson ${ci(s.asrBefore.ci95)})`);
      console.log(`ASR Blue ON  : ${pct(s.asrAfter.rate)}  (${s.asrAfter.successes}/${s.asrAfter.n}, 95% Wilson ${ci(s.asrAfter.ci95)})`);
      console.log(`Relative reduction: ${pct(s.relativeReduction)}`);
      console.log(`Benign false refusal: off ${pct(s.falseRefusalBefore.rate)} (n=${s.falseRefusalBefore.n}), on ${pct(s.falseRefusalAfter.rate)} (n=${s.falseRefusalAfter.n})`);
      console.log(`refusal detection: ${s.refusalDetection}`);
      console.log(`manifest sha256 ${s.manifestSha256}`);
    }
  }

  h("2b. MEASURED  KV-cache timing side channel (Red TTFT while Blue idle vs busy)");
  const samples = Number(process.env.DEMO_SAMPLES ?? 12);
  for (const mode of ["shared", "resource_limited", "cache_salted"]) {
    const s = await call("/api/v1/side-channel/run", "POST", { mode, samples });
    if (s.status !== 202) { console.log(`${mode}: UNAVAILABLE (HTTP ${s.status}): ${s.data?.error?.message}`); continue; }
    for (;;) {
      const j = (await call("/api/v1/side-channel/status")).data;
      process.stdout.write(`\r  ${mode}: ${j.done}/${j.total}   `);
      if (j.status !== "running") { if (j.status === "failed") console.log(`\n  failed: ${j.error}`); break; }
      await sleep(2000);
    }
    console.log();
  }
  const sc = (await call("/api/v1/side-channel/latest")).data as any[];
  for (const r of sc) {
    console.log(`${r.mode.padEnd(17)} [${r.source}] AUC=${r.auc?.toFixed(3)} CI95 ${r.aucCi95 ? `[${r.aucCi95.map((x: number) => x.toFixed(3)).join(", ")}]` : "n/a"} n=${r.nIdle}/${r.nBusy}  median TTFT idle ${r.ttftMedianIdleMs?.toFixed(0)} ms, busy ${r.ttftMedianBusyMs?.toFixed(0)} ms\n${" ".repeat(18)}${r.interpretation}`);
  }

  // ---------------------------------------------------------------- VERIFIED
  h("3. VERIFIED  tamper-evident audit");
  const v1 = (await call("/api/v1/audit/verify")).data;
  console.log(`chain: ${v1.isValid ? "PASS" : "FAIL"} (${v1.totalEvents} events, checkpoints valid=${v1.checkpointsValid}) head ${v1.head.slice(0, 24)}...`);
  const t = (await call("/api/v1/audit/tamper-demo", "POST", {})).data;
  if (t.status === "EXECUTED") {
    console.log(`tamper: ${t.mutation} (event #${t.tamperedIndex})`);
    console.log(`  during tamper -> ${t.during.valid ? "PASS" : "FAIL"} at index ${t.during.brokenIndex}: ${t.during.reason}`);
    console.log(`  after restore -> ${t.after.valid ? "PASS" : "FAIL"}`);
  } else console.log(`tamper demo UNAVAILABLE: ${t.reason}`);
  const v2 = (await call("/api/v1/audit/verify")).data;
  console.log(`verify again: ${v2.isValid ? "PASS" : "FAIL"}`);

  const bundle = await call("/api/v1/audit/export");
  const file = resolve(root, "bayora-audit-bundle.json");
  writeFileSync(file, JSON.stringify(bundle.data));
  console.log(`\nExported ${bundle.data.totalEvents} events to ${file}. Offline verifier (no API, no DB):`);
  const off = spawnSync(process.execPath, [resolve(root, "scripts", "verify-bundle.mjs"), file], { encoding: "utf-8" });
  process.stdout.write(off.stdout + off.stderr);
  console.log(`offline verifier exit code: ${off.status}`);

  h("Access control self-test");
  const at = (await call("/api/v1/access/selftest", "POST")).data;
  if (at.checks) {
    for (const c of at.checks) console.log(`${c.passed ? "ok  " : "FAIL"} ${String(c.gotStatus).padEnd(4)} (want ${c.expectedStatus}) ${c.name}`);
    console.log(`${at.passed}/${at.total} as expected`);
  }
  console.log("\nDone. Open the console at http://localhost:3000 for the same data.");
}

main().catch((e) => { console.error(e); process.exit(1); });
