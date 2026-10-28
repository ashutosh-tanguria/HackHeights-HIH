import { auditService } from "../audit/audit-service";
import { IsolationService } from "./isolation-service";
import { SideChannelService } from "./side-channel-service";
import { BenchmarkEvaluator } from "../evaluation/benchmark-evaluator";

export type Status = "VERIFIED" | "UNVERIFIED" | "SIMULATED" | "PLANNED" | "NOT_PROTECTED";

export interface ThreatRow {
  id: string;
  threat: string;
  vertical: string;
  mitigation: string;
  /** Live status, derived from stored evidence. UNVERIFIED = implemented but the verifying command has not been run yet. */
  status: Status;
  evidence: string;
  verifyCommand: string;
  /** Analyst estimates on a 1-5 scale. These are judgements, not measurements. */
  likelihood: number;
  impact: number;
  residualRisk: number;
  residualNote: string;
}

const row = (r: Omit<ThreatRow, "residualRisk">): ThreatRow => ({ ...r, residualRisk: r.likelihood * r.impact });

/**
 * Status comes from stored evidence at request time; likelihood and impact are assessed by the authors
 * (1 = low, 5 = high) AFTER the listed mitigation is assumed to work, and are labelled ASSESSED in every UI.
 */
export function buildThreatModel(isolation: IsolationService): ThreatRow[] {
  const probes = isolation.latest();
  const probeOk = !!probes && probes.status === "EXECUTED" && probes.failed === 0 && probes.inconclusive === 0;
  const sc = SideChannelService.latestPerMode();
  const salted = sc.find((s) => s.mode === "cache_salted");
  const shared = sc.find((s) => s.mode === "shared");
  const evals = BenchmarkEvaluator.list().filter((e) => e.summary);
  const lastEval = evals[0]?.summary ?? null;
  const audit = auditService().verify();

  const probeStatus: Status = probeOk ? "VERIFIED" : "UNVERIFIED";
  const probeEvidence = probes ? (probes.status === "UNAVAILABLE" ? `last run UNAVAILABLE: ${probes.reason}` : `${probes.passed}/${probes.total} probes as expected (run ${probes.id})`) : "no probe run recorded yet";

  const scStatus = (r: typeof salted): Status => (!r ? "UNVERIFIED" : r.source === "simulated" ? "SIMULATED" : "VERIFIED");

  return [
    row({ id: "T1", threat: "Red observes Blue (or Blue observes Red) over the network", vertical: "Network segmentation", mitigation: "Separate internal Docker networks; only the gateway joins both", status: probeStatus, evidence: probeEvidence, verifyCommand: "pnpm demo  (or POST /api/v1/probes/run)", likelihood: 2, impact: 4, residualNote: "Docker bridge isolation relies on the host kernel/iptables; a kernel escape voids it." }),
    row({ id: "T2", threat: "Red or Blue reaches the target model directly, bypassing gateway limits and audit", vertical: "Network segmentation", mitigation: "Target only on target_net; probes try name and IP", status: probeStatus, evidence: probeEvidence, verifyCommand: "POST /api/v1/probes/run", likelihood: 2, impact: 4, residualNote: "Same as T1." }),
    row({ id: "T3", threat: "Container breakout / privilege escalation", vertical: "Container isolation", mitigation: "cap_drop ALL, no-new-privileges, read-only rootfs, non-root, pids/mem/cpu limits", status: probeStatus, evidence: probeEvidence, verifyCommand: "POST /api/v1/probes/run (capability, rootfs and uid probes)", likelihood: 2, impact: 5, residualNote: "Shared host kernel. gVisor/Kata manifests exist in infra/ but are PLANNED, not exercised by docker compose." }),
    row({ id: "T4", threat: "Red reads Blue's defence logic or Blue reads Red's payloads (files / API)", vertical: "Access control", mitigation: "Per-tenant volumes, HMAC capability tokens with capability+resource scope, tenant derived from token only", status: probeStatus, evidence: `${probeEvidence}; token scoping is also checked live by POST /api/v1/access/selftest`, verifyCommand: "POST /api/v1/access/selftest", likelihood: 2, impact: 4, residualNote: "Blue must see prompts in order to filter them. Blue is trusted not to log them; the audit chain stores only hashes." }),
    row({ id: "T5", threat: "Audit log altered after the fact", vertical: "Tamper-evident audit", mitigation: "SHA-256 hash chain + Ed25519 signed checkpoints + offline verifier", status: audit.isValid ? "VERIFIED" : "UNVERIFIED", evidence: audit.isValid ? `chain of ${audit.totalEvents} events verifies, ${audit.checkpoints.length} checkpoints signed` : `chain FAILS at index ${audit.brokenIndex}`, verifyCommand: "GET /api/v1/audit/verify; node scripts/verify-bundle.mjs bundle.json", likelihood: 2, impact: 4, residualNote: "An attacker with write access to both the database and the signing key (same data volume) can rewrite history. Anchor checkpoints externally to close this." }),
    row({ id: "T6", threat: "KV/prefix-cache timing side channel reveals other tenant's activity", vertical: "LLM threats", mitigation: "Per-tenant HMAC cache salt (prompt-prefix salting)", status: scStatus(salted), evidence: salted ? `${salted.mode}: AUC ${salted.auc?.toFixed(3)} ${salted.aucCi95 ? `[${salted.aucCi95.map((x) => x.toFixed(3)).join(", ")}]` : ""}${shared ? `; shared: AUC ${shared.auc?.toFixed(3)}` : ""} (${salted.source})` : "no side-channel run recorded yet", verifyCommand: "POST /api/v1/side-channel/run", likelihood: 3, impact: 3, residualNote: "Measured on one small CPU model. GPU contention, scheduler queueing and power/thermal channels are not covered." }),
    row({ id: "T7", threat: "Blue defence does not reduce attack success (or over-refuses benign prompts)", vertical: "Evaluation validity", mitigation: "Before/after evaluation with Wilson CI and benign false-refusal rate", status: !lastEval ? "UNVERIFIED" : lastEval.isMock ? "SIMULATED" : "VERIFIED", evidence: lastEval ? `${lastEval.claimLevel}: ASR ${pct(lastEval.asrBefore.rate)} -> ${pct(lastEval.asrAfter.rate)}, n=${lastEval.nAdversarial}, false refusal ${pct(lastEval.falseRefusalAfter.rate)}` : "no evaluation recorded yet", verifyCommand: "POST /api/v1/evaluations/run", likelihood: 3, impact: 3, residualNote: "Refusal detection is a keyword heuristic and Blue rules are lexical; results do not transfer to other models or stronger attacks." }),
    row({ id: "T8", threat: "Cross-session contamination of the model (canaries survive a reset)", vertical: "LLM threats", mitigation: "Per-evaluation tokens and cache salts; canary scan on output", status: "PLANNED", evidence: "Output canary rule exists in the Blue rules; no automated cross-session contamination experiment is implemented.", verifyCommand: "n/a", likelihood: 2, impact: 3, residualNote: "Ollama keeps no per-session state we reset explicitly; restart the target between evaluations for a clean slate." }),
    row({ id: "T9", threat: "Resource exhaustion / noisy neighbour distorts results", vertical: "Resource governance", mitigation: "Gateway rate limit + per-tenant concurrency cap; container pids/mem/cpu limits", status: "UNVERIFIED", evidence: "Limits are enforced in code and compose; the 429 path is covered by an (unrun) unit test.", verifyCommand: "pnpm test", likelihood: 3, impact: 2, residualNote: "Limits are per gateway process and in memory; they reset on restart." }),
    row({ id: "T10", threat: "Compromise of the gateway (it holds the Docker socket for probes)", vertical: "Control plane", mitigation: "Gateway is non-root, cap_drop ALL, read-only; console binds to localhost", status: "NOT_PROTECTED", evidence: "Mounting /var/run/docker.sock gives the gateway host-level control. Anyone who can exploit the gateway owns the host.", verifyCommand: "n/a", likelihood: 2, impact: 5, residualNote: "Alternative (works today): run the API on the host with `pnpm dev` and keep only red/blue/target in compose, so no container holds the socket." }),
    row({ id: "T11", threat: "Single node, shared host kernel, GPU and timing channels", vertical: "Scope limits", mitigation: "None in this PoC", status: "NOT_PROTECTED", evidence: "Everything runs on one Docker host.", verifyCommand: "n/a", likelihood: 3, impact: 4, residualNote: "Out of scope for the hackathon PoC. See README limitations." }),
  ];
}

const pct = (x: number | null) => (x === null ? "n/a" : `${(x * 100).toFixed(1)}%`);
