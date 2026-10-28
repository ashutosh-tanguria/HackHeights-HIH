"use client";

import { useState } from "react";
import { useBayora } from "@/lib/bayora-store";
import { EvaluationConfig } from "@/types/bayora";
import {
  FlaskConical,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Layers,
  Shield,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Flame,
  Zap,
} from "lucide-react";

export default function EvaluationsPage() {
  const { evaluations, activeEvaluationId, setActiveEvaluationId, createEvaluation } = useBayora();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // New Eval Form State
  const [newEvalName, setNewEvalName] = useState("Adversarial Robust Refusal Benchmark #43");
  const [newTargetModel, setNewTargetModel] = useState("meta-llama/Llama-3-70b-Instruct");
  const [newDataset, setNewDataset] = useState<EvaluationConfig["dataset"]>("HarmBench-v1");
  const [newAttackIntensity, setNewAttackIntensity] = useState<EvaluationConfig["attackIntensity"]>("standard");
  const [newPolicyVersion, setNewPolicyVersion] = useState("policy-v3-strict");
  const [newIsolationLevel, setNewIsolationLevel] = useState<EvaluationConfig["isolationLevel"]>("gvisor_hardened_cache_salted");
  const [newCacheSalting, setNewCacheSalting] = useState(true);
  const [newSeed, setNewSeed] = useState(42);

  const selectedEval = evaluations.find((e) => e.id === activeEvaluationId) || evaluations[0];

  const filteredEvaluations = evaluations.filter((ev) => {
    const matchesSearch = ev.name.toLowerCase().includes(searchQuery.toLowerCase()) || ev.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleLaunchEvaluation = () => {
    const created = createEvaluation({
      name: newEvalName,
      targetModel: newTargetModel,
      dataset: newDataset,
      attackIntensity: newAttackIntensity,
      policyVersion: newPolicyVersion,
      isolationLevel: newIsolationLevel,
      cacheSaltingEnabled: newCacheSalting,
      seed: newSeed,
    });
    setIsWizardOpen(false);
    setWizardStep(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <FlaskConical className="h-6 w-6 text-cyan-400" />
            <span>Evaluations & Reproducibility Capsules</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Freeze model versions, isolation policies, datasets, and container digests into deterministic security runs.
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Evaluation Wizard</span>
        </button>
      </div>

      {/* Main Grid: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Evaluation List */}
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search evaluations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="running">Running</option>
            </select>
          </div>

          {/* List Cards */}
          <div className="space-y-2.5">
            {filteredEvaluations.map((ev) => {
              const isSelected = ev.id === activeEvaluationId;
              return (
                <div
                  key={ev.id}
                  onClick={() => setActiveEvaluationId(ev.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/40"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">{ev.id}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        ev.status === "completed"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-blue-950 text-blue-400 border border-blue-800 animate-pulse"
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-1.5 line-clamp-1">{ev.name}</h3>
                  <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>{ev.config.dataset}</span>
                    <span>{ev.config.isolationLevel.split("_")[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Evaluation Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEval && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold">{selectedEval.id}</span>
                    <span className="text-xs text-slate-400 font-mono">• Created: {selectedEval.createdAt}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{selectedEval.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700">
                    Seed: {selectedEval.config.seed}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">DEFENDED REFUSAL</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {selectedEval.metrics.defendedRefusalRate}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">ATTACK SUCCESS</div>
                  <div className="text-lg font-bold text-rose-400 mt-1">
                    {selectedEval.metrics.attackSuccessRate}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">SIDE-CHANNEL AUC</div>
                  <div className="text-lg font-bold text-cyan-400 mt-1">
                    {selectedEval.metrics.sideChannelAuc}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">ISOLATION PROBES</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {selectedEval.metrics.blockedAccessAttempts} / {selectedEval.metrics.totalProbes} Passed
                  </div>
                </div>
              </div>

              {/* Reproducibility Capsule */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4" />
                    <span>FROZEN REPRODUCIBILITY CAPSULE</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">IMMUTABLE ANCHOR</span>
                </div>

                <div className="text-xs font-mono text-slate-300 space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Policy Hash:</span>
                    <span className="text-cyan-300">{selectedEval.reproducibilityCapsule.policyHash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dataset Version:</span>
                    <span className="text-slate-200">{selectedEval.reproducibilityCapsule.datasetVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Image Digest:</span>
                    <span className="text-slate-200 truncate max-w-[240px]">
                      {selectedEval.reproducibilityCapsule.containerImageDigests.targetRuntime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Signed Checkpoint:</span>
                    <span className="text-emerald-400 truncate max-w-[240px]">
                      {selectedEval.reproducibilityCapsule.signedCheckpointHash}
                    </span>
                  </div>
                </div>
              </div>

              {/* Execution Steps */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Orchestration & Verification Steps</h3>
                <div className="space-y-2">
                  {selectedEval.steps.map((st, i) => (
                    <div
                      key={st.id}
                      className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{i + 1}.</span>
                        <div>
                          <div className="text-white font-medium">{st.name}</div>
                          <div className="text-[11px] text-slate-400 font-sans">{st.message}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-[11px]">{st.durationMs}ms</span>
                        {st.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : st.status === "running" ? (
                          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Step Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h2 className="text-lg font-bold text-white">Create Deterministic Evaluation</h2>
                <div className="text-xs font-mono text-cyan-400">Step {wizardStep} of 4</div>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Step 1: Evaluation Config & Metadata</h3>
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Evaluation Title</label>
                    <input
                      type="text"
                      value={newEvalName}
                      onChange={(e) => setNewEvalName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Target Model Runtime</label>
                    <select
                      value={newTargetModel}
                      onChange={(e) => setNewTargetModel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
                    >
                      <option value="meta-llama/Llama-3-70b-Instruct">meta-llama/Llama-3-70b-Instruct (vLLM)</option>
                      <option value="mistralai/Mistral-Large-2">mistralai/Mistral-Large-2 (vLLM)</option>
                      <option value="claude-3-5-sonnet-sim">claude-3-5-sonnet (Deterministic Simulator)</option>
                    </select>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Step 2: Red Team Adversarial Corpus</h3>
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Standardized Dataset</label>
                    <select
                      value={newDataset}
                      onChange={(e) => setNewDataset(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
                    >
                      <option value="HarmBench-v1">HarmBench-v1 (Robust Refusal Evaluation)</option>
                      <option value="AdvBench-GCG">AdvBench-GCG (Universal Jailbreak Suffixes)</option>
                      <option value="Gandalf-Lakera">Gandalf / Lakera (Prompt Injection Hierarchy)</option>
                      <option value="ToxiGen-Implicit">ToxiGen (Implicit Adversarial Bias)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Attack Intensity</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["standard", "aggressive", "exhaustive"].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setNewAttackIntensity(lvl as any)}
                          className={`p-2 rounded-lg text-xs font-mono uppercase font-semibold border ${
                            newAttackIntensity === lvl
                              ? "bg-rose-950 text-rose-300 border-rose-700"
                              : "bg-slate-950 text-slate-400 border-slate-800"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Step 3: Security & Isolation Boundaries</h3>
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Isolation Profile</label>
                    <select
                      value={newIsolationLevel}
                      onChange={(e) => setNewIsolationLevel(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
                    >
                      <option value="gvisor_hardened_cache_salted">
                        Bayora Full Defense (gVisor runsc + CNI + KV Cache Salted)
                      </option>
                      <option value="k8s_network_isolated">
                        Network Isolated Only (runc + NetworkPolicy, No Salt)
                      </option>
                      <option value="standard_docker">
                        Flat Shared Docker (Baseline Failure Demo)
                      </option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <input
                      type="checkbox"
                      id="cacheSalt"
                      checked={newCacheSalting}
                      onChange={(e) => setNewCacheSalting(e.target.checked)}
                      className="h-4 w-4 rounded accent-cyan-500"
                    />
                    <label htmlFor="cacheSalt" className="text-xs font-mono text-slate-300 cursor-pointer">
                      Enable per-tenant vLLM prefix-cache salting (eliminates timing leakage)
                    </label>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Step 4: Review Frozen Parameters</h3>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2 text-slate-300">
                    <div><span className="text-slate-400">Title:</span> {newEvalName}</div>
                    <div><span className="text-slate-400">Model:</span> {newTargetModel}</div>
                    <div><span className="text-slate-400">Dataset:</span> {newDataset} ({newAttackIntensity})</div>
                    <div><span className="text-slate-400">Isolation:</span> {newIsolationLevel}</div>
                    <div><span className="text-slate-400">Cache Salting:</span> {newCacheSalting ? "ENABLED" : "DISABLED"}</div>
                    <div><span className="text-slate-400">Random Seed:</span> {newSeed}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950">
              <button
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((p) => p - 1)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono disabled:opacity-40"
              >
                Back
              </button>
              {wizardStep < 4 ? (
                <button
                  onClick={() => setWizardStep((p) => p + 1)}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleLaunchEvaluation}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-cyan-500/20"
                >
                  Launch & Freeze Evaluation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
