"use client";

import { useState } from "react";
import { useBayora } from "@/lib/bayora-store";
import {
  Settings,
  Server,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Cpu,
  Layers,
  Shield,
  Key,
} from "lucide-react";

export default function SettingsPage() {
  const { resetDemoState, activeRole, setActiveRole } = useBayora();

  const [resetAlert, setResetAlert] = useState(false);

  const handleReset = () => {
    resetDemoState();
    setResetAlert(true);
    setTimeout(() => setResetAlert(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-xs font-mono font-bold border border-slate-800">
              CLUSTER CONFIGURATION
            </span>
            <span className="text-xs text-cyan-400 font-mono">INTEGRATION PROFILE</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-cyan-400" />
            <span>Platform Settings & Runtime Integrations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Configure underlying container runtimes, Kubernetes cluster connectivity, KMS root signing keys, and environment simulation flags.
          </p>
        </div>
      </div>

      {resetAlert && (
        <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Demo state successfully reset to initial seed values!</span>
        </div>
      )}

      {/* Mode Status Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Execution Provider Mode</h2>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 text-xs font-mono font-bold border border-amber-800">
            DETERMINISTIC SIMULATION ACTIVE
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          To ensure reliable, instant, and reproducible demonstrations during competition judging without requiring an active multi-node Kubernetes GPU cluster, Bayora is operating in <strong>Deterministic Simulation Mode</strong>. All isolation probes, hash calculations, and side-channel measurements run verified mathematical equations and genuine cryptographic SHA-256 routines.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs pt-2">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[10px]">KUBERNETES CNI</div>
            <div className="text-emerald-400 font-bold mt-1">Cilium Default-Deny</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[10px]">SANDBOX RUNTIME</div>
            <div className="text-cyan-400 font-bold mt-1">runsc (gVisor)</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[10px]">TARGET LLM BACKEND</div>
            <div className="text-white font-bold mt-1">vLLM v0.6.2 (APC Salted)</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[10px]">ROOT SIGNING KEY</div>
            <div className="text-emerald-400 font-bold mt-1">Ed25519 HSM Key</div>
          </div>
        </div>
      </div>

      {/* Role View Setting */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">RBAC Role Simulation</h2>
        <p className="text-xs text-slate-400 font-sans">
          Switch roles to verify that Red and Blue Teams cannot see each other's sensitive states or private configurations.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          {[
            { id: "admin", label: "Admin Console", desc: "Full cluster visibility" },
            { id: "red_team", label: "Red Runner", desc: "Attack corpus visible only" },
            { id: "blue_team", label: "Blue Defender", desc: "Defense rules visible only" },
            { id: "auditor", label: "Compliance Auditor", desc: "Forensic logs only" },
          ].map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id as any)}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeRole === role.id
                  ? "bg-slate-950 border-cyan-500 shadow-md shadow-cyan-950/40"
                  : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="text-white font-bold">{role.label}</div>
              <div className="text-[10px] text-slate-400 mt-1">{role.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Danger Zone / Reset State */}
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Reset Demonstration Arena</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Restores initial seed evaluations, clean audit hash chains, and default probe statuses.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs transition-all flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </div>
    </div>
  );
}
