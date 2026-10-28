export type TenantType = "red" | "blue" | "target" | "gateway" | "control_plane" | "evaluator";

export type EvaluationStatus = "draft" | "provisioning" | "running" | "completed" | "failed" | "terminated";

export interface EvaluationConfig {
  id: string;
  name: string;
  targetModel: string;
  targetVersion: string;
  dataset: "HarmBench-v1" | "AdvBench-GCG" | "JailbreakBench" | "Gandalf-Lakera" | "ToxiGen-Implicit" | "Custom";
  attackIntensity: "standard" | "aggressive" | "exhaustive";
  policyVersion: string;
  isolationLevel: "standard_docker" | "k8s_network_isolated" | "gvisor_hardened_cache_salted";
  cacheSaltingEnabled: boolean;
  cpuQuota: string;
  memoryQuota: string;
  tokenBudget: number;
  rateLimitRpm: number;
  seed: number;
  reproducibilityHash?: string;
}

export interface EvaluationStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  durationMs: number;
  message: string;
  timestamp: string;
}

export interface Evaluation {
  id: string;
  name: string;
  status: EvaluationStatus;
  createdAt: string;
  completedAt?: string;
  config: EvaluationConfig;
  steps: EvaluationStep[];
  metrics: {
    totalProbes: number;
    blockedAccessAttempts: number;
    attackSuccessRate: number; // percentage
    defendedRefusalRate: number; // percentage
    meanLatencyMs: number;
    ttftP50Ms: number;
    ttftP99Ms: number;
    sideChannelAuc: number;
    auditIntegrityPassed: boolean;
    canaryDetectedAfterReset: boolean;
  };
  reproducibilityCapsule: ReproducibilityCapsule;
}

export interface ReproducibilityCapsule {
  evaluationId: string;
  timestamp: string;
  containerImageDigests: {
    redRunner: string;
    blueDefender: string;
    targetRuntime: string;
    gateway: string;
  };
  policyHash: string;
  datasetVersion: string;
  randomSeed: number;
  signedCheckpointHash: string;
  verificationSignature: string;
}

export interface SandboxNode {
  id: string;
  name: string;
  namespace: string;
  tenant: TenantType;
  runtime: "runsc (gVisor)" | "runc (Standard)" | "crun";
  status: "active" | "idle" | "throttled" | "stopped";
  ipAddress: string;
  cgroupCpuLimit: string;
  cgroupMemLimit: string;
  seccompProfile: "bayora-strict-seccomp.json" | "RuntimeDefault" | "Unconfined";
  rootFilesystem: "read-only" | "read-write";
  capabilitiesDropped: string[];
}

export interface BoundaryProbe {
  id: string;
  source: string;
  target: string;
  probeType: "network" | "filesystem" | "secret" | "direct_target" | "resource" | "session_contamination";
  title: string;
  command: string;
  description: string;
  expectedResult: "BLOCKED" | "MEASURED" | "VERIFIED";
  actualResult?: "BLOCKED" | "ALLOWED" | "LEAKED" | "PASSED" | "VERIFIED" | "MEASURED";
  enforcementLayer: "NetworkPolicy" | "gVisor AppKernel" | "Read-only RootFS" | "Inference Gateway" | "cgroups v2" | "Session Reset Hook";
  status: "idle" | "running" | "passed" | "failed";
  latencyMs?: number;
  outputLog?: string;
  timestamp?: string;
  severity: "critical" | "high" | "medium" | "low";
}

export interface RedTeamScenario {
  id: string;
  name: string;
  category: "Prompt Injection" | "Jailbreak / GCG" | "Instruction Hierarchy" | "PII Extraction" | "Tool Misuse" | "Implicit Toxicity";
  datasetSource: string;
  severity: "Critical" | "High" | "Medium";
  promptPayload: string;
  description: string;
  expectedRefusalKeywords: string[];
}

export interface AttackExecution {
  id: string;
  scenarioId: string;
  scenarioName: string;
  timestamp: string;
  payloadSnippet: string;
  gatewayCorrelationId: string;
  targetModel: string;
  redTenantToken: string;
  decision: "BLOCKED_BY_GATEWAY" | "REFUSED_BY_TARGET" | "DEFENDED_BY_BLUE" | "EXPLOIT_SUCCESS";
  latencyMs: number;
  tokensConsumed: number;
  isSanitizedForBlue: boolean;
}

export interface DefenseRule {
  id: string;
  name: string;
  type: "input_filter" | "injection_classifier" | "output_canary" | "rate_limiter" | "system_prompt_shield";
  enabled: boolean;
  strictness: "lax" | "moderate" | "strict" | "paranoid";
  threshold: number;
  description: string;
}

export interface BlueTeamDefense {
  version: string;
  name: string;
  rules: DefenseRule[];
  deployedAt: string;
  falsePositiveRateEst: number;
  latencyPenaltyMs: number;
}

export interface GatewayRequest {
  id: string;
  timestamp: string;
  evaluationId: string;
  tenant: "red" | "blue";
  capability: "model.inference" | "model.tokenize" | "admin.reset";
  tokenCount: number;
  quotaRemaining: number;
  cacheSalt: string;
  policyVersion: string;
  status: "ALLOWED" | "DENIED" | "RATE_LIMITED";
  reason: string;
  latencyMs: number;
  redactedExcerpt: string;
}

export interface SideChannelDataPoint {
  requestIndex: number;
  blueIdleTTFT: number;
  blueBusyTTFT: number;
  blueIdleLatency: number;
  blueBusyLatency: number;
  throughputIdle: number;
  throughputBusy: number;
}

export interface SideChannelExperiment {
  id: string;
  timestamp: string;
  mode: "baseline_shared" | "resource_isolated" | "cache_salted_isolated";
  sampleSize: number;
  blueIdleStats: {
    ttftP50: number;
    ttftP95: number;
    ttftP99: number;
    meanLatency: number;
    variance: number;
  };
  blueBusyStats: {
    ttftP50: number;
    ttftP95: number;
    ttftP99: number;
    meanLatency: number;
    variance: number;
  };
  classifierAuc: number;
  classifierAccuracy: number;
  mutualInformationBits: number;
  dataPoints: SideChannelDataPoint[];
  verdict: "SIGNIFICANT_SIDE_CHANNEL" | "WEAK_SIDE_CHANNEL" | "NO_SIGNIFICANT_TIMING_SIGNAL";
}

export interface AuditEvent {
  index: number;
  eventId: string;
  evaluationId: string;
  timestamp: string;
  actor: "red_runner" | "blue_defender" | "gateway" | "orchestrator" | "isolation_probe";
  eventType: "SANDBOX_INITIALIZED" | "PROBE_EXECUTED" | "GATEWAY_INFERENCE" | "POLICY_VIOLATION" | "CANARY_INJECTED" | "SESSION_RESET" | "CHECKPOINT_SIGNED";
  payloadSummary: string;
  canonicalPayload: string;
  previousHash: string;
  currentHash: string;
  isTampered?: boolean;
}

export interface SecurityFinding {
  id: string;
  category: "Network Isolation" | "Filesystem Boundaries" | "Secret Protection" | "Resource Governance" | "Cache Side-Channel" | "Session Contamination" | "Audit Trail";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "PASSED";
  title: string;
  description: string;
  status: "MITIGATED" | "RESIDUAL_RISK" | "VERIFIED_SECURE" | "VIOLATION_DETECTED";
  affectedComponent: string;
  evidenceHash: string;
  reproductionSteps: string;
  remediation: string;
  residualRiskNotes: string;
}

export interface RegressionGateResult {
  passed: boolean;
  baselineVersion: string;
  candidateVersion: string;
  timestamp: string;
  checks: {
    name: string;
    baselineVal: string | number;
    candidateVal: string | number;
    threshold: string;
    passed: boolean;
    severity: "BLOCKER" | "WARNING" | "INFO";
  }[];
  verdict: "DEPLOYMENT_ALLOWED" | "DEPLOYMENT_BLOCKED_REGRESSION_DETECTED";
}
