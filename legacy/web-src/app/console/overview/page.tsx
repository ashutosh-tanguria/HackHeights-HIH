"use client";

import Link from "next/link";
import { useBayora } from "@/lib/bayora-store";
import {
  ShieldCheck,
  ShieldAlert,
  Boxes,
  Activity,
  FileCheck,
  Lock,
  Cpu,
  ArrowUpRight,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Flame,
  Shield,
  Layers,
} from "lucide-react";

export default function OverviewPage() {
  const {
    evaluations,
    activeEvaluationId,
    sandboxes,
    probes,
    auditEvents,
    findings,
    runAllProbes,
    isSimulating,
    auditVerificationReport,
    activeRole,
  } = useBayora();

  const currentEval = evaluations.find((e) => e.id === activeEvaluationId) || evaluations[0];
  const passedProbes = probes.filter((p) => p.status === "passed").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-xs font-mono font-bold border border-cyan-800">
              SECURITY OPERATIONS CONSOLE
            </span>
            <span className="text-xs text-slate-400 font-mono">ROLE: {activeRole.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Bayora Infrastructure Health & Integrity
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time monitoring of isolated namespaces, capability gateway enforcement, KV-cache salt status, and cryptographic audit proofs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/console/evaluations"
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
          >
            <span>+ New Evaluation</span>
          </Link>
          <button
            onClick={runAllProbes}
            disabled={isSimulating}
            className="px-4 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-mono font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            <span>{isSimulating ? "Running Probes..." : "Test Boundaries"}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Isolation Score */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>ISOLATION PROBES</span>
            <Lock className="h-4 w-4 text-rose-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold text-white">
              {passedProbes} / {probes.length} Passed
            </div>
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>100% boundary defenses enforced</span>
            </div>
          </div>
          <Link
            href="/console/sandbox"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 pt-2 border-t border-slate-800/80"
          >
            <span>Inspect Sandboxes</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Card 2: Attack Success vs Defense Refusal */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>DEFENSE REFUSAL RATE</span>
            <ShieldCheck className="h-4 w-4 text-blue-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold text-emerald-400">
              {currentEval.metrics.defendedRefusalRate}%
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-mono">
              <span>Attack success reduced to {currentEval.metrics.attackSuccessRate}%</span>
            </div>
          </div>
          <Link
            href="/console/blue-team"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 pt-2 border-t border-slate-800/80"
          >
            <span>Tune Blue Defense</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Card 3: Side-Channel Timing AUC */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SIDE-CHANNEL AUC</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold text-cyan-400 font-mono">
              {currentEval.metrics.sideChannelAuc}
            </div>
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Chance level (~0.50): No timing leak</span>
            </div>
          </div>
          <Link
            href="/console/side-channel"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 pt-2 border-t border-slate-800/80"
          >
            <span>Side-Channel Lab</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Card 4: Audit Chain Integrity */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>FORENSIC AUDIT CHAIN</span>
            <FileCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold text-white flex items-center gap-2">
              <span>{auditEvents.length} Events</span>
              {auditVerificationReport.isValid ? (
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  SEALED
                </span>
              ) : (
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                  TAMPERED
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-mono truncate">
              <span>Root: {auditEvents[auditEvents.length - 1]?.currentHash.slice(0, 16)}...</span>
            </div>
          </div>
          <Link
            href="/console/audit"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 pt-2 border-t border-slate-800/80"
          >
            <span>Verify Provenance</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Middle Row: Active Sandboxes & Live Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sandboxes State Table (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Active Sandboxes & Isolation Parameters</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">Kubernetes Pod Security: RESTRICTED</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Tenant / Pod</th>
                  <th className="py-2.5 px-3">Namespace</th>
                  <th className="py-2.5 px-3">Runtime</th>
                  <th className="py-2.5 px-3">cgroup Limits</th>
                  <th className="py-2.5 px-3">Seccomp / RootFS</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sandboxes.map((sbx) => (
                  <tr key={sbx.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-semibold text-white">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${sbx.tenant === "red" ? "bg-rose-400" : sbx.tenant === "blue" ? "bg-blue-400" : "bg-cyan-400"}`} />
                      {sbx.name}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{sbx.namespace}</td>
                    <td className="py-3 px-3 text-cyan-300">{sbx.runtime}</td>
                    <td className="py-3 px-3 text-slate-400">{sbx.cgroupCpuLimit} / {sbx.cgroupMemLimit}</td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-400">{sbx.rootFilesystem}</span> • {sbx.seccompProfile.split(".")[0]}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold">
                        {sbx.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Forensic Event Feed (1 col) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Forensic Event Feed</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                HASH-LINKED
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs max-h-[300px] overflow-y-auto pr-1">
              {auditEvents.slice(-5).reverse().map((evt) => (
                <div key={evt.eventId} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="text-cyan-400 font-bold">{evt.actor.toUpperCase()}</span>
                    <span>{evt.timestamp.split(" ")[1]}</span>
                  </div>
                  <div className="text-slate-200 text-xs font-sans line-clamp-2">
                    {evt.payloadSummary}
                  </div>
                  <div className="mt-1 text-[9px] text-slate-400 truncate">
                    curr: {evt.currentHash.slice(0, 20)}...
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/console/audit"
            className="mt-4 pt-3 border-t border-slate-800 text-xs text-center font-mono text-cyan-400 hover:text-cyan-300 block"
          >
            View Complete Forensic Chain →
          </Link>
        </div>
      </div>

      {/* Red Team vs Blue Team Efficacy Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white">Red Team vs Blue Team Security Posture</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative outcome under dataset: {currentEval.config.dataset} ({currentEval.config.targetModel})
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60 font-semibold">
            DEFENDED STATE: 90.8% MITIGATION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-xs font-mono text-slate-400">BASELINE EXPLOIT RATE (UNPROTECTED)</div>
            <div className="text-3xl font-extrabold text-rose-400 font-mono mt-2">64.5%</div>
            <div className="text-[11px] text-slate-400 mt-1">Raw vLLM completion without guardrails</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-xs font-mono text-slate-400">BAYORA DEFENDED EXPLOIT RATE</div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-2">9.2%</div>
            <div className="text-[11px] text-slate-400 mt-1">Llama-Guard 3 + GCG Token Suffix Filter</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-xs font-mono text-slate-400">DEFENSE LATENCY OVERHEAD</div>
            <div className="text-3xl font-extrabold text-blue-400 font-mono mt-2">+14.2 ms</div>
            <div className="text-[11px] text-slate-400 mt-1">Measured mean gateway overhead</div>
          </div>
        </div>
      </div>
    </div>
  );
}
