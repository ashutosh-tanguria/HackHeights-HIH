// Shapes returned by the Bayora API (apps/api). Kept in sync by hand; the API is the source of truth.

export interface ProbeResult {
  id: string;
  title: string;
  category: string;
  container: string;
  expect: "DENIED" | "REACHED";
  observed: "DENIED" | "REACHED" | "ERROR";
  passed: boolean;
  detail: string;
  evidence: { command: string; exitCode: number | null; stdout: string; stderr: string; durationMs: number };
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

export interface Rate {
  successes: number;
  n: number;
  rate: number | null;
  ci95: [number, number] | null;
}
export interface EvalSummary {
  id: string;
  claimLevel: "MEASURED" | "MOCK";
  provider: string;
  model: string;
  isMock: boolean;
  blueExecution: string | null;
  nAdversarial: number;
  nBenign: number;
  asrBefore: Rate;
  asrAfter: Rate;
  relativeReduction: number | null;
  falseRefusalBefore: Rate;
  falseRefusalAfter: Rate;
  manifestSha256: string;
  manifestRejectedRows: string[];
  refusalDetection: string;
  rowsSha256: string;
  completedAt: string;
}
export interface Evaluation {
  id: string;
  status: "running" | "completed" | "failed" | "cancelled";
  error: string | null;
  config: { maxAdversarial: number; maxBenign: number; seed: number; maxTokens: number };
  summary: EvalSummary | null;
  createdAt: string;
  updatedAt: string;
  progress?: { done: number; total: number } | null;
}
export interface EvalRow {
  caseId: string;
  dataset: string;
  category: string;
  expected: "refuse" | "comply";
  stage: "before" | "after";
  blockedBy: string | null;
  refused: boolean;
  attackSuccess: boolean | null;
  falseRefusal: boolean | null;
  responseSnippet: string;
  ttftMs: number | null;
}

export interface SideChannelResult {
  id: string;
  mode: "shared" | "resource_limited" | "cache_salted";
  description: string;
  source: "measured" | "simulated";
  provider: string;
  model: string;
  nIdle: number;
  nBusy: number;
  auc: number | null;
  aucCi95: [number, number] | null;
  separability: number | null;
  ttftMedianIdleMs: number | null;
  ttftMedianBusyMs: number | null;
  ttftP95Ms: number | null;
  detectableLeak: boolean | null;
  interpretation: string;
  createdAt: string;
  samples?: Array<{ seq: number; blueState: "IDLE" | "BUSY"; ttftMs: number; totalMs: number }>;
}
export interface SideChannelJob {
  id: string | null;
  mode: string | null;
  status: "idle" | "running" | "completed" | "failed";
  done: number;
  total: number;
  error: string | null;
}

export interface AuditEvent {
  index: number;
  timestamp: string;
  actor: string;
  action: string;
  targetResource: string;
  payloadSummary: string;
  previousHash: string;
  currentHash: string;
  evaluationId: string;
}
export interface AuditVerify {
  isValid: boolean;
  brokenIndex: number | null;
  totalEvents: number;
  reason?: string;
  head: string;
  publicKeyFingerprint: string;
  checkpointsValid: boolean;
  checkpoints: Array<{ id: string; eventIndex: number; signatureValid: boolean; matchesChain: boolean }>;
}
export interface TamperResult {
  status: "EXECUTED" | "UNAVAILABLE";
  reason?: string;
  tamperedIndex?: number;
  mutation?: string;
  before?: { valid: boolean; brokenIndex: number | null };
  during?: { valid: boolean; brokenIndex: number | null; reason?: string };
  after?: { valid: boolean; brokenIndex: number | null };
  restored?: boolean;
}
export interface Anomaly {
  id: number;
  ts: string;
  kind: string;
  severity: "info" | "warning" | "critical";
  tenant: string;
  summary: string;
  auditIndex: number | null;
}
export interface AccessCheck {
  name: string;
  request: string;
  expectedStatus: number;
  gotStatus: number;
  passed: boolean;
}
export interface ThreatRow {
  id: string;
  threat: string;
  vertical: string;
  mitigation: string;
  status: "VERIFIED" | "UNVERIFIED" | "SIMULATED" | "PLANNED" | "NOT_PROTECTED";
  evidence: string;
  verifyCommand: string;
  likelihood: number;
  impact: number;
  residualRisk: number;
  residualNote: string;
}
export interface Overview {
  service: { provider: string; model: string; isMock: boolean; modelReachable: boolean; modelReason: string | null; blueFilterMode: string; ephemeralSecrets: string[]; labBusy: string | null };
  probes: ProbeRun | null;
  evaluation: EvalSummary | null;
  lastEvaluationStatus: { id: string; status: string; error: string | null } | null;
  sideChannel: SideChannelResult[];
  audit: { isValid: boolean; brokenIndex: number | null; totalEvents: number; head: string; checkpointsValid: boolean };
  anomalies: Anomaly[];
}
