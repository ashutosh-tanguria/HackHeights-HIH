"use client";

import { useState } from "react";
import { useBayora } from "@/lib/bayora-store";
import {
  Flame,
  Play,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Send,
  Zap,
  Lock,
  Layers,
  Terminal,
  Clock,
  EyeOff,
} from "lucide-react";

export default function RedTeamPage() {
  const { scenarios, recentAttacks, executeRedAttack, activeRole } = useBayora();

  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarios[0].id);
  const [customPrompt, setCustomPrompt] = useState(scenarios[0].promptPayload);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const handleScenarioChange = (id: string) => {
    setSelectedScenarioId(id);
    const scen = scenarios.find((s) => s.id === id);
    if (scen) setCustomPrompt(scen.promptPayload);
  };

  const handleRunAttack = async () => {
    setIsExecuting(true);
    const result = await executeRedAttack(selectedScenarioId, customPrompt);
    setLastResult(result);
    setIsExecuting(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 text-xs font-mono font-bold border border-rose-800">
              ADVERSARIAL WORKBENCH
            </span>
            <span className="text-xs text-slate-400 font-mono">TENANT: RED RUNNER</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <Flame className="h-6 w-6 text-rose-400" />
            <span>Red Team Adversarial Synthesis Playground</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Controlled adversarial execution of prompt injections, GCG jailbreak suffixes, and instruction hierarchy attacks through the Inference Gateway.
          </p>
        </div>

        {/* Role scoping indicator */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-300">
          <EyeOff className="h-4 w-4 text-amber-400" />
          <span>Blue Defense Internal Weights: <strong className="text-rose-400">HIDDEN</strong></span>
        </div>
      </div>

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Attack Scenario Catalog (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-mono text-slate-400 uppercase font-semibold">
            Standardized Attack Catalog
          </div>

          <div className="space-y-2.5">
            {scenarios.map((scen) => {
              const isSelected = scen.id === selectedScenarioId;
              return (
                <div
                  key={scen.id}
                  onClick={() => handleScenarioChange(scen.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-slate-900 border-rose-500 shadow-md shadow-rose-950/40"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-cyan-400">{scen.datasetSource}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 font-bold border border-rose-800 text-[10px]">
                      {scen.severity}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-1.5">{scen.name}</h3>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2 font-sans">
                    {scen.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Safe Attack Playground & Packet Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Playground Panel */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-rose-400 font-bold">
                PAYLOAD EDITOR • {selectedScenario.category}
              </span>
              <span className="text-xs font-mono text-slate-400">Target: meta-llama/Llama-3-70b-Instruct</span>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1.5">
                Adversarial Prompt Payload (Editable)
              </label>
              <textarea
                rows={5}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Gateway Outgoing Packet Preview */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="text-cyan-400 font-bold">OUTGOING CAPABILITY PACKET PREVIEW:</div>
              <div>POST https://gateway.bayora-ingress:8443/v1/infer</div>
              <div className="text-slate-400">
                Headers: <span className="text-slate-300">x-bayora-tenant: red | x-bayora-capability: model.inference</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs font-mono text-slate-400">
                Safety Guarantee: Executed inside gVisor AppKernel
              </div>
              <button
                onClick={handleRunAttack}
                disabled={isExecuting}
                className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-rose-600/25 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isExecuting ? "Executing via Gateway..." : "Launch Attack Payload"}</span>
              </button>
            </div>
          </div>

          {/* Execution Result Box */}
          {lastResult && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-bold">GATEWAY MEDIATED RESPONSE</span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                    lastResult.decision === "EXPLOIT_SUCCESS"
                      ? "bg-rose-950 text-rose-300 border border-rose-700"
                      : "bg-emerald-950 text-emerald-300 border border-emerald-700"
                  }`}
                >
                  DECISION: {lastResult.decision}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">CORRELATION ID</div>
                  <div className="text-slate-300 truncate mt-0.5">{lastResult.gatewayCorrelationId}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">LATENCY</div>
                  <div className="text-slate-300 mt-0.5">{lastResult.latencyMs}ms</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">TOKENS USED</div>
                  <div className="text-slate-300 mt-0.5">{lastResult.tokensConsumed} tok</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
                <div className="text-slate-400 text-[10px] mb-1">TARGET RESPONSE OUTPUT (SANITIZED):</div>
                <div className="text-slate-200">
                  {lastResult.decision === "DEFENDED_BY_BLUE"
                    ? "[BAYORA DEFENSE INTERCEPT] The defensive classifier (Llama-Guard 3) detected an adversarial instruction violation and filtered this generation."
                    : lastResult.decision === "REFUSED_BY_TARGET"
                    ? "I cannot fulfill this request. I am programmed to follow strict AI safety standards and refuse malicious or offensive instructions."
                    : "Model generated affirmative completion. Exploit succeeded under current defense thresholds."}
                </div>
              </div>
            </div>
          )}

          {/* Recent Attacks History Table */}
          {recentAttacks.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-xs font-mono text-slate-400 uppercase font-semibold mb-3">
                Recent Adversarial Executions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Scenario</th>
                      <th className="py-2 px-3">Correlation</th>
                      <th className="py-2 px-3">Decision</th>
                      <th className="py-2 px-3">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentAttacks.slice(0, 5).map((atk) => (
                      <tr key={atk.id}>
                        <td className="py-2.5 px-3 font-semibold text-white truncate max-w-[180px]">{atk.scenarioName}</td>
                        <td className="py-2.5 px-3 text-slate-400">{atk.gatewayCorrelationId}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${atk.decision === "EXPLOIT_SUCCESS" ? "bg-rose-950 text-rose-400 border border-rose-800" : "bg-emerald-950 text-emerald-400 border border-emerald-800"}`}>
                            {atk.decision}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{atk.latencyMs}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
