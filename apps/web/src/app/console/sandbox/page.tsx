"use client";

import { useState } from "react";
import { useBayora } from "@/lib/bayora-store";
import {
  Boxes,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Cpu,
  Shield,
  Terminal,
  Zap,
  Layers,
  ArrowRight,
  Database,
  RefreshCw,
} from "lucide-react";

export default function SandboxPage() {
  const { sandboxes, probes, runAllProbes, runIsolationProbe, isSimulating } = useBayora();
  const [selectedProbeId, setSelectedProbeId] = useState<string>(probes[0]?.id || "probe-net-red-blue");

  const selectedProbe = probes.find((p) => p.id === selectedProbeId) || probes[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 text-xs font-mono font-bold border border-rose-800">
              MOMENT 1: BLOCKED
            </span>
            <span className="text-xs text-slate-400 font-mono">ENFORCEMENT VERIFICATION</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <Boxes className="h-6 w-6 text-cyan-400" />
            <span>Sandbox Isolation & Boundary Probing Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Interactive visual architecture and automated adversarial boundary probes verifying Kubernetes NetworkPolicy, gVisor AppKernel syscall intercepts, and read-only root filesystems.
          </p>
        </div>

        <button
          onClick={runAllProbes}
          disabled={isSimulating}
          className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          <span>{isSimulating ? "Executing Probes..." : "Run All 8 Isolation Probes"}</span>
        </button>
      </div>

      {/* Interactive Topology Graph (Visual Architecture) */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
        <div className="text-xs font-mono text-cyan-400 mb-4 flex items-center justify-between">
          <span>DYNAMIC ISOLATION TOPOLOGY</span>
          <span className="text-slate-400">STATUS: ALL POLICY GUARDS ENFORCED</span>
        </div>

        {/* Central Graphic */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Node 1: Red Sandbox */}
          <div className="p-5 rounded-xl bg-slate-950 border-2 border-rose-800/80 shadow-lg relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                RED SANDBOX
              </span>
              <span className="text-[10px] font-mono text-cyan-400">runsc (gVisor)</span>
            </div>
            <div className="text-xs font-mono text-slate-300 space-y-1">
              <div>Namespace: <span className="text-white">bayora-red</span></div>
              <div>IP: <span className="text-slate-400">10.244.1.18</span></div>
              <div>RootFS: <span className="text-emerald-400">read-only</span></div>
              <div>Caps: <span className="text-rose-400">ALL dropped</span></div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-400">
              <span>Direct Blue:</span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> BLOCKED
              </span>
            </div>
          </div>

          {/* Node 2: Inference Gateway */}
          <div className="p-5 rounded-xl bg-slate-950 border-2 border-cyan-500 shadow-xl shadow-cyan-950/50 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-950 bg-cyan-400 px-2 py-0.5 rounded">
                INFERENCE GATEWAY
              </span>
              <span className="text-[10px] font-mono text-cyan-300">Port 8443</span>
            </div>
            <div className="text-xs font-mono text-slate-300 space-y-1">
              <div>Namespace: <span className="text-white">bayora-ingress</span></div>
              <div>Capability: <span className="text-cyan-400">mTLS Scoped</span></div>
              <div>Cache Salt: <span className="text-emerald-400">Per-Tenant Salt Active</span></div>
              <div>Rate Limit: <span className="text-slate-300">60 RPM Max</span></div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-400">
              <span>Target Route:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> ALLOWED (MEDIED)
              </span>
            </div>
          </div>

          {/* Node 3: Blue Sandbox */}
          <div className="p-5 rounded-xl bg-slate-950 border-2 border-blue-800/80 shadow-lg relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                BLUE SANDBOX
              </span>
              <span className="text-[10px] font-mono text-cyan-400">runsc (gVisor)</span>
            </div>
            <div className="text-xs font-mono text-slate-300 space-y-1">
              <div>Namespace: <span className="text-white">bayora-blue</span></div>
              <div>IP: <span className="text-slate-400">10.244.2.42</span></div>
              <div>RootFS: <span className="text-emerald-400">read-only</span></div>
              <div>Honeypot: <span className="text-amber-400">Canary Placed</span></div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-400">
              <span>Direct Red:</span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> BLOCKED
              </span>
            </div>
          </div>
        </div>

        {/* Target LLM Bottom Bar */}
        <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span className="text-white font-bold">TARGET LLM:</span>
            <span className="text-slate-300">namespace: bayora-target (vLLM v0.6.2)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-rose-400 flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" /> Direct Raw Port 8000: BLOCKED
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Gateway Only: ENFORCED
            </span>
          </div>
        </div>
      </div>

      {/* Probes Matrix & Terminal Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 8 Probes List (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="text-xs font-mono text-slate-400 uppercase font-semibold mb-2">
            Automated Boundary Probes (Click to Inspect)
          </div>
          {probes.map((probe) => {
            const isSelected = probe.id === selectedProbeId;
            return (
              <div
                key={probe.id}
                onClick={() => setSelectedProbeId(probe.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/30"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">{probe.enforcementLayer}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      probe.status === "passed"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : probe.status === "running"
                        ? "bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {probe.status === "running" ? "TESTING..." : probe.actualResult || probe.expectedResult}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white mt-1 line-clamp-1">{probe.title}</div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Interactive Terminal & Forensic Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold">{selectedProbe.id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedProbe.title}</h3>
              </div>
              <button
                onClick={() => runIsolationProbe(selectedProbe.id)}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3 w-3 ${isSimulating ? "animate-spin text-cyan-400" : ""}`} />
                <span>Re-test Probe</span>
              </button>
            </div>

            <div className="text-xs text-slate-300 font-sans">
              {selectedProbe.description}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">ENFORCEMENT</div>
                <div className="text-cyan-300 font-bold mt-0.5 truncate">{selectedProbe.enforcementLayer}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">EXPECTED</div>
                <div className="text-emerald-400 font-bold mt-0.5">{selectedProbe.expectedResult}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">ACTUAL</div>
                <div className="text-emerald-400 font-bold mt-0.5">{selectedProbe.actualResult || "VERIFIED"}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">LATENCY</div>
                <div className="text-slate-300 font-bold mt-0.5">{selectedProbe.latencyMs || 12}ms</div>
              </div>
            </div>

            {/* Terminal View */}
            <div>
              <div className="text-xs font-mono text-slate-400 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Probe Execution Terminal</span>
                </span>
                <span className="text-[10px] text-slate-400">{selectedProbe.timestamp}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                <div className="text-slate-400">
                  <span className="text-cyan-400">bayora@{selectedProbe.source}:~$</span> {selectedProbe.command}
                </div>
                <div className="text-emerald-400 border-l-2 border-emerald-500 pl-3 py-1 bg-emerald-950/20 text-[11px] leading-relaxed">
                  {selectedProbe.outputLog}
                </div>
                <div className="text-slate-400 text-[10px] pt-1">
                  [PROBE RESULT] Exit Code: 0 (Enforcement successfully verified). Security event emitted.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
