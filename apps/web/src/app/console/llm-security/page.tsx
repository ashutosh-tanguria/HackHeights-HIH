"use client";

import { useState } from "react";
import { useBayora } from "@/lib/bayora-store";
import {
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Layers,
  Terminal,
} from "lucide-react";

export default function LLMSecurityPage() {
  const { testSessionCanary, isSimulating } = useBayora();

  const [cacheSaltedEnabled, setCacheSaltedEnabled] = useState(true);
  const [testResult, setTestResult] = useState<{ leaked: boolean; details: string } | null>(null);

  const handleRunCanaryTest = async () => {
    const res = await testSessionCanary(cacheSaltedEnabled);
    setTestResult(res);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-xs font-mono font-bold border border-cyan-800">
              LLM-NATIVE THREAT SURFACE
            </span>
            <span className="text-xs text-slate-400 font-mono">vLLM PREFIX CACHE & CANARIES</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <Cpu className="h-6 w-6 text-cyan-400" />
            <span>LLM KV-Cache Isolation & Session Contamination</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Neutralize shared prefix-cache timing side-channels using cryptographic per-tenant cache salting, and verify zero residual context survives sandbox teardown.
          </p>
        </div>
      </div>

      {/* Explanatory Diagram Box */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
        <h2 className="text-sm font-bold text-white mb-3">How vLLM Cache Salting Prevents Cross-Tenant Leakage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/40 space-y-2">
            <div className="text-rose-400 font-bold">UNPROTECTED SHARED KV CACHE:</div>
            <div className="text-slate-400 leading-relaxed font-sans">
              Tenant A sends prompt <code className="text-slate-200">"Classified Target Plan X"</code>. vLLM computes and stores KV blocks in global prefix cache.
              Tenant B later sends <code className="text-slate-200">"Classified Target"</code>: cache hit occurs, leading to a distinct 80ms latency drop. Tenant B now knows Tenant A queried Target Plan X!
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/40 space-y-2">
            <div className="text-emerald-400 font-bold">BAYORA PER-TENANT CACHE SALTING:</div>
            <div className="text-slate-400 leading-relaxed font-sans">
              Gateway hashes tenant identity and evaluation secret into a unique salt: <code className="text-cyan-300">salt = HMAC(tenant_id, eval_id)</code>.
              vLLM keys the prefix namespace using this salt. Cache hit cannot be reused across tenants; timing channel eliminated!
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Contamination Canary Experiment */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Interactive Session Contamination Canary Test</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inject synthetic honeytoken into Session A context, trigger sandbox teardown, and probe Session B.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="toggleSalt"
                checked={cacheSaltedEnabled}
                onChange={(e) => setCacheSaltedEnabled(e.target.checked)}
                className="h-4 w-4 rounded accent-cyan-500 cursor-pointer"
              />
              <label htmlFor="toggleSalt" className="text-xs font-mono text-slate-300 cursor-pointer">
                Cache Salting Active
              </label>
            </div>

            <button
              onClick={handleRunCanaryTest}
              disabled={isSimulating}
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              <span>{isSimulating ? "Testing Canary..." : "Execute Canary Test"}</span>
            </button>
          </div>
        </div>

        {/* 3 Step Sequence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-bold">STEP 1: INJECT CANARY</div>
            <div className="text-slate-400 text-[11px] font-sans">
              Evaluation #42 primes target model with secret token:
            </div>
            <div className="p-2 rounded bg-slate-900 text-cyan-300 text-[10px] truncate">
              CANARY_CTX_EXP42_8891
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-bold">STEP 2: TEARDOWN & RESET</div>
            <div className="text-slate-400 text-[11px] font-sans">
              Evaluation ends. Orchestrator destroys namespace and cycles salt keys.
            </div>
            <div className="p-2 rounded bg-slate-900 text-slate-300 text-[10px]">
              {cacheSaltedEnabled ? "Salt Rotated + Cache Partitioned" : "Unchanged Global Cache Pool"}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-bold">STEP 3: RECALL VERIFICATION</div>
            <div className="text-slate-400 text-[11px] font-sans">
              Evaluation #43 queries model with targeted memory extraction probes.
            </div>
            <div className="p-2 rounded bg-slate-900 text-slate-300 text-[10px]">
              {testResult ? (
                testResult.leaked ? (
                  <span className="text-rose-400 font-bold">LEAKED: Canary Found</span>
                ) : (
                  <span className="text-emerald-400 font-bold">CLEAN: 0 Tokens Recalled</span>
                )
              ) : (
                "Awaiting Test Execution"
              )}
            </div>
          </div>
        </div>

        {/* Test Result Terminal Box */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border font-mono text-xs space-y-1 ${
              testResult.leaked
                ? "bg-rose-950/40 border-rose-800 text-rose-300"
                : "bg-emerald-950/40 border-emerald-800 text-emerald-300"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {testResult.leaked ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{testResult.leaked ? "CONTAMINATION DETECTED" : "SESSION ISOLATION VERIFIED"}</span>
            </div>
            <div className="text-[11px] pl-6 leading-relaxed font-sans">{testResult.details}</div>
          </div>
        )}
      </div>
    </div>
  );
}
