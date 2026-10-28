"use client";

import { useState } from "react";
import { useBayora } from "@/lib/bayora-store";
import {
  Activity,
  Play,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  Cpu,
  Zap,
} from "lucide-react";

export default function SideChannelLabPage() {
  const {
    sideChannelExperiment,
    sideChannelMode,
    runSideChannelBenchmark,
    isSimulating,
  } = useBayora();

  const [selectedMode, setSelectedMode] = useState<"baseline_shared" | "resource_isolated" | "cache_salted_isolated">(
    sideChannelMode
  );

  const handleRun = async (mode: "baseline_shared" | "resource_isolated" | "cache_salted_isolated") => {
    setSelectedMode(mode);
    await runSideChannelBenchmark(mode);
  };

  const exp = sideChannelExperiment;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 text-xs font-mono font-bold border border-amber-800">
              MOMENT 2: MEASURED
            </span>
            <span className="text-xs text-slate-400 font-mono">QUANTITATIVE EMPIRICAL VERIFICATION</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-amber-400" />
            <span>LLM Side-Channel & Timing Leakage Laboratory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Empirical benchmark measuring whether an adversary can infer Blue Team’s activity or payload characteristics from TTFT latency distributions and KV-cache reuse timing.
          </p>
        </div>
      </div>

      {/* Mode Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => handleRun("baseline_shared")}
          disabled={isSimulating}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedMode === "baseline_shared"
              ? "bg-slate-900 border-rose-500 shadow-lg shadow-rose-950/40"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-rose-400 font-bold">MODE 1: BASELINE</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px]">UNPROTECTED</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1.5">Naive Shared Cache & Resources</h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Flat Docker container sharing un-salted vLLM prefix cache pool and unconstrained CPU/RAM.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleRun("resource_isolated")}
          disabled={isSimulating}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedMode === "resource_isolated"
              ? "bg-slate-900 border-amber-500 shadow-lg shadow-amber-950/40"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400 font-bold">MODE 2: CGROUPS ONLY</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px]">PARTIAL</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1.5">Resource Limits Enforced</h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Strict cgroups v2 CFS quota on CPU/memory, but vLLM cache salting remains disabled.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleRun("cache_salted_isolated")}
          disabled={isSimulating}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedMode === "cache_salted_isolated"
              ? "bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-950/40"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-bold">MODE 3: FULL DEFENSE</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px]">BAYORA</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1.5">Resource + Cache Salting</h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            gVisor sandboxing + cgroups + per-tenant scoped vLLM cache salt. Complete timing neutralization.
          </p>
        </button>
      </div>

      {/* Main Quantitative Findings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        {/* AUC Metric */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>CLASSIFIER AUC</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="my-3">
            <div
              className={`text-4xl font-extrabold ${
                exp.classifierAuc > 0.75
                  ? "text-rose-400"
                  : exp.classifierAuc > 0.6
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {exp.classifierAuc.toFixed(3)}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-sans">
              {exp.classifierAuc <= 0.55
                ? "Chance performance (~0.50). Adversary cannot distinguish Blue Idle vs Busy."
                : "Observable timing difference! Adversary accurately predicts Blue state."}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Target Threshold: &lt; 0.55 (Neutralized)
          </div>
        </div>

        {/* Binary Accuracy */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>PREDICTIVE ACCURACY</span>
            <Cpu className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="my-3">
            <div
              className={`text-4xl font-extrabold ${
                exp.classifierAccuracy > 75
                  ? "text-rose-400"
                  : exp.classifierAccuracy > 60
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {exp.classifierAccuracy.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1 font-sans">
              Balanced binary classification over 24 controlled trials.
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Chance baseline: 50.0%
          </div>
        </div>

        {/* Mutual Information */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>MUTUAL INFORMATION</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="my-3">
            <div
              className={`text-4xl font-extrabold ${
                exp.mutualInformationBits > 0.4
                  ? "text-rose-400"
                  : exp.mutualInformationBits > 0.15
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {exp.mutualInformationBits.toFixed(2)} bits
            </div>
            <div className="text-xs text-slate-400 mt-1 font-sans">
              Dependency between model TTFT latency and Blue tenant state.
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Residual noise floor: &lt; 0.05 bits
          </div>
        </div>
      </div>

      {/* Latency Distributions & Bar Charts */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">Time-To-First-Token (TTFT) Latency Histograms</h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Comparing Red Team prompt prefill response when Blue is completely IDLE vs actively BUSY.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">Sample Size: {exp.sampleSize} requests</span>
        </div>

        {/* Visual Bar Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {/* Blue Idle Stats */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-cyan-400 font-bold">CONDITION A: BLUE IDLE</span>
              <span>Mean: {exp.blueIdleStats.meanLatency}ms</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>TTFT p50</span>
                  <span>{exp.blueIdleStats.ttftP50}ms</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${Math.min(100, (exp.blueIdleStats.ttftP50 / 180) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>TTFT p95</span>
                  <span>{exp.blueIdleStats.ttftP95}ms</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${Math.min(100, (exp.blueIdleStats.ttftP95 / 180) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>TTFT p99</span>
                  <span>{exp.blueIdleStats.ttftP99}ms</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-300 rounded-full"
                    style={{ width: `${Math.min(100, (exp.blueIdleStats.ttftP99 / 180) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Blue Busy Stats */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-amber-400 font-bold">CONDITION B: BLUE BUSY (CONCURRENT WORKLOAD)</span>
              <span>Mean: {exp.blueBusyStats.meanLatency}ms</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>TTFT p50</span>
                  <span>{exp.blueBusyStats.ttftP50}ms</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedMode === "baseline_shared" ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, (exp.blueBusyStats.ttftP50 / 180) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>TTFT p95</span>
                  <span>{exp.blueBusyStats.ttftP95}ms</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedMode === "baseline_shared" ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, (exp.blueBusyStats.ttftP95 / 180) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>TTFT p99</span>
                  <span>{exp.blueBusyStats.ttftP99}ms</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedMode === "baseline_shared" ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, (exp.blueBusyStats.ttftP99 / 180) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 font-sans flex items-start gap-3">
        <Info className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-white font-bold font-mono">SCIENTIFIC RIGOR & RESIDUAL RISK NOTE</div>
          <p>
            Per-tenant vLLM cache salting isolates the logical prefix cache hierarchy so Red cannot reuse or detect Blue prompt prefixes.
            However, we do not claim to eliminate all theoretical physical hardware side channels: microscopic GPU DRAM bus contention
            or power fluctuations remain out of scope for software sandbox isolation.
          </p>
        </div>
      </div>
    </div>
  );
}
