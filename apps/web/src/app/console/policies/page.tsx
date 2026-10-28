"use client";

import { useState } from "react";
import { useBayora } from "@/lib/bayora-store";
import {
  FileCode,
  CheckCircle2,
  Layers,
  Shield,
  Terminal,
  Zap,
  Copy,
  Hash,
} from "lucide-react";

const SAMPLE_SECURITY_CONTRACT = `# BAYORA UNIFIED SECURITY CONTRACT v3.1
metadata:
  policyId: "policy-v3-strict"
  evaluationScope: "all-tenants"
  runtimeTarget: "k8s-gvisor"

rules:
  - name: "isolate-red-tenant"
    tenant: "red"
    network:
      egress:
        allow:
          - target: "bayora-ingress:8443"
            protocol: "TCP"
        denyAllOther: true
    capabilities:
      granted: ["model.inference"]
      denied: ["admin.*", "secrets.read", "host.*"]
    filesystem:
      rootReadOnly: true
      disallowedMounts: ["/proc/1", "/sys", "/var/run/docker.sock"]

  - name: "isolate-blue-tenant"
    tenant: "blue"
    network:
      egress:
        allow:
          - target: "bayora-ingress:8443"
            protocol: "TCP"
        denyAllOther: true
    capabilities:
      granted: ["model.inference", "metrics.read"]
      denied: ["red.payloads.read", "model.weights.export"]

  - name: "isolate-target-llm"
    tenant: "target"
    network:
      ingress:
        allowOnlyFrom: "bayora-ingress"
    cachePolicy:
      requirePerTenantSalt: true
      rotateSaltOnTeardown: true
`;

const COMPILED_NETWORK_POLICY = `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: bayora-default-deny-and-gateway-route
  namespace: bayora-red
spec:
  podSelector:
    matchLabels:
      tenant: red
  policyTypes:
    - Ingress
    - Egress
  ingress: [] # Default deny all incoming packets
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: bayora-ingress
          podSelector:
            matchLabels:
              app.kubernetes.io/name: inference-gateway
      ports:
        - protocol: TCP
          port: 8443
`;

const COMPILED_OPA_CONSTRAINT = `apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRestrictedPodSecurity
metadata:
  name: bayora-strict-workload-enforcement
spec:
  enforcementAction: deny
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaces: ["bayora-red", "bayora-blue"]
  parameters:
    runAsNonRoot: true
    allowPrivilegeEscalation: false
    runtimeClass: "runsc"
    capabilities:
      drop: ["ALL"]
    seccompProfile:
      type: "RuntimeDefault"
`;

const COMPILED_GATEWAY_CONFIG = `{
  "policyVersion": "policy-v3-strict",
  "policyHash": "sha256:7f4a9b2184e1b009c...",
  "tenants": {
    "red": {
      "allowedCapabilities": ["model.inference"],
      "rateLimitRpm": 60,
      "maxTokenBudget": 50000,
      "cacheSaltPrefix": "salt_red_",
      "hideOpponentTelemetry": true
    },
    "blue": {
      "allowedCapabilities": ["model.inference", "metrics.read"],
      "rateLimitRpm": 60,
      "maxTokenBudget": 50000,
      "cacheSaltPrefix": "salt_blue_",
      "hideOpponentTelemetry": true
    }
  }
}`;

export default function PoliciesPage() {
  const [contractYaml, setContractYaml] = useState(SAMPLE_SECURITY_CONTRACT);
  const [activeTab, setActiveTab] = useState<"k8s" | "opa" | "gateway">("k8s");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy =
      activeTab === "k8s"
        ? COMPILED_NETWORK_POLICY
        : activeTab === "opa"
        ? COMPILED_OPA_CONSTRAINT
        : COMPILED_GATEWAY_CONFIG;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-xs font-mono font-bold border border-cyan-800">
              POLICY COMPILER
            </span>
            <span className="text-xs text-slate-400 font-mono">POLICY-AS-CODE PIPELINE</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <FileCode className="h-6 w-6 text-cyan-400" />
            <span>Bayora Unified Security Contract & Compiler</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Store one human-readable Bayora security contract, then compile it deterministically into Kubernetes NetworkPolicy, OPA Gatekeeper admission rules, and Inference Gateway capability scopes.
          </p>
        </div>
      </div>

      {/* Compiler Grid: Source Contract on Left, Compiled Artifacts on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Human Readable Contract DSL (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono text-cyan-400 font-bold">
              SOURCE SECURITY CONTRACT (YAML DSL)
            </span>
            <span className="text-xs font-mono text-emerald-400">STATUS: VALID</span>
          </div>

          <textarea
            rows={22}
            value={contractYaml}
            onChange={(e) => setContractYaml(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500"
          />

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-cyan-400" />
              <span>Policy Hash: <code className="text-slate-300">sha256:7f4a9b2184e1...</code></span>
            </div>
            <span className="text-xs font-mono text-emerald-400">100% Declarative Alignment</span>
          </div>
        </div>

        {/* Right Column: Compiled Outputs (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("k8s")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeTab === "k8s"
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                K8s NetworkPolicy
              </button>
              <button
                onClick={() => setActiveTab("opa")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeTab === "opa"
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                OPA Gatekeeper
              </button>
              <button
                onClick={() => setActiveTab("gateway")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  activeTab === "gateway"
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                Gateway JSON
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto">
            <pre className="text-xs font-mono text-slate-300 leading-relaxed">
              {activeTab === "k8s"
                ? COMPILED_NETWORK_POLICY
                : activeTab === "opa"
                ? COMPILED_OPA_CONSTRAINT
                : COMPILED_GATEWAY_CONFIG}
            </pre>
          </div>

          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span>Enforcement: Cluster-Wide Automated</span>
            <span className="text-cyan-400">Zero Configuration Drift</span>
          </div>
        </div>
      </div>
    </div>
  );
}
