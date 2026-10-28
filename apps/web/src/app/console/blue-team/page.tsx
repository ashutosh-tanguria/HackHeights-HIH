"use client";

import { useState } from "react";
import { useBayora } from "@/lib/bayora-store";
import {
  Shield,
  ShieldCheck,
  Zap,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  EyeOff,
  Layers,
  ArrowRight,
  Clock,
} from "lucide-react";

export default function BlueTeamPage() {
  const { blueDefense, updateBlueDefenseRule, isSimulating } = useBayora();

  const [isUpdating, setIsUpdating] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleToggleRule = (ruleId: string, current: boolean) => {
    updateBlueDefenseRule(ruleId, !current);
    setSuccessBanner("Defense rule updated. Active matrix redeployed to Gateway.");
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 text-xs font-mono font-bold border border-blue-800">
              DEFENSIVE MATRIX
            </span>
            <span className="text-xs text-slate-400 font-mono">TENANT: BLUE DEFENDER</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-blue-400" />
            <span>Blue Team Defenses & Mitigation Controls</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Configure real-time input sanitizers, instruction hierarchy boundaries, honeytoken canary traps, and output content classifiers.
          </p>
        </div>

        {/* Role Scoping Tag */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-300">
          <EyeOff className="h-4 w-4 text-cyan-400" />
          <span>Red Attack Corpus: <strong className="text-blue-400">ROLE-ISOLATED</strong></span>
        </div>
      </div>

      {successBanner && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Comparative Defense Metrics Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="text-xs font-mono text-cyan-400 font-bold mb-4 flex items-center justify-between">
          <span>MEASURED DEFENSE IMPACT (BEFORE VS AFTER)</span>
          <span className="text-slate-400">Matrix: {blueDefense.version}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-400">BASELINE ATTACK EXPLOIT</div>
            <div className="text-2xl font-extrabold text-rose-400 mt-1">64.5%</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Unmitigated baseline</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-400">DEFENDED ATTACK EXPLOIT</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">9.2%</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">-55.3% reduction</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-400">EST. FALSE POSITIVES</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-1">{blueDefense.falsePositiveRateEst}%</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Benign request blocks</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-400">LATENCY OVERHEAD</div>
            <div className="text-2xl font-extrabold text-blue-400 mt-1">+{blueDefense.latencyPenaltyMs}ms</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Classification delay</div>
          </div>
        </div>
      </div>

      {/* Defense Rules List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase font-semibold">
          <span>Active Defensive Guardrails ({blueDefense.rules.filter((r) => r.enabled).length} Enabled)</span>
          <span>Gateway Integration: Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blueDefense.rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-5 rounded-2xl border transition-all ${
                rule.enabled
                  ? "bg-slate-900/90 border-blue-600/60 shadow-lg shadow-blue-950/20"
                  : "bg-slate-900/40 border-slate-800 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-bold uppercase">
                  {rule.type.replace("_", " ")}
                </span>
                <button
                  onClick={() => handleToggleRule(rule.id, rule.enabled)}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                    rule.enabled
                      ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {rule.enabled ? "ACTIVE" : "DISABLED"}
                </button>
              </div>

              <h3 className="text-sm font-bold text-white">{rule.name}</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
                {rule.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Strictness: <strong className="text-slate-200">{rule.strictness}</strong></span>
                <span>Threshold: <strong className="text-cyan-400">{rule.threshold}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
