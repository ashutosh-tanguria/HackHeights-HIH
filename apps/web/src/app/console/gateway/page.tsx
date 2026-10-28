"use client";

import { useState } from "react";
import { useBayora } from "@/lib/bayora-store";
import {
  Zap,
  ShieldCheck,
  Send,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  Activity,
  Cpu,
} from "lucide-react";

export default function GatewayPage() {
  const { gatewayRequests, simulateGatewayRequest } = useBayora();

  const [simTenant, setSimTenant] = useState<"red" | "blue">("red");
  const [simCapability, setSimCapability] = useState<"model.inference" | "admin.reset">("model.inference");
  const [simPrompt, setSimPrompt] = useState("Explain how to write a zero-day exploit for Linux kernel eBPF");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestSimResult, setLatestSimResult] = useState<any>(null);

  const handleSimulate = async () => {
    setIsSubmitting(true);
    const res = await simulateGatewayRequest({
      tenant: simTenant,
      capability: simCapability,
      prompt: simPrompt,
    });
    setLatestSimResult(res);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-xs font-mono font-bold border border-cyan-800">
              CAPABILITY BROKER
            </span>
            <span className="text-xs text-slate-400 font-mono">PORT 8443 (mTLS)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <Zap className="h-6 w-6 text-cyan-400" />
            <span>Controlled Inference Gateway & Capability Broker</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Converts target LLM from a raw shared network socket into a capability-authorized mediation point. Enforces token budgets, rate limits, per-tenant cache salts, and structured forensic logging.
          </p>
        </div>
      </div>

      {/* Gateway Architecture Summary */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-300">
        <div className="text-cyan-400 font-bold mb-3 flex items-center justify-between">
          <span>CAPABILITY ROUTING TOPOLOGY</span>
          <span className="text-emerald-400">mTLS Handshake: ACTIVE</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-rose-400 font-bold">RED TEAM RUNNER</div>
            <div className="text-[11px] text-slate-400 mt-1">Granted: `model.inference`</div>
            <div className="text-[10px] text-emerald-400 mt-2">Cache Salt: salt_red_xxx</div>
          </div>
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-700/60 shadow-lg shadow-cyan-950/50">
            <div className="text-cyan-300 font-bold">BAYORA INFERENCE GATEWAY</div>
            <div className="text-[11px] text-slate-400 mt-1">Quota, Salt Injection & Redaction</div>
            <div className="text-[10px] text-cyan-400 mt-2">Correlation ID Minting</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-blue-400 font-bold">BLUE TEAM DEFENDER</div>
            <div className="text-[11px] text-slate-400 mt-1">Granted: `model.inference`</div>
            <div className="text-[10px] text-emerald-400 mt-2">Cache Salt: salt_blue_yyy</div>
          </div>
        </div>
      </div>

      {/* Interactive Request Simulator & Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Simulator Input (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="text-xs font-mono text-cyan-400 font-bold uppercase">
            Interactive Gateway Request Simulator
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Tenant Identity</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSimTenant("red")}
                className={`py-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                  simTenant === "red"
                    ? "bg-rose-950 text-rose-300 border-rose-700"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                Tenant: Red Team
              </button>
              <button
                type="button"
                onClick={() => setSimTenant("blue")}
                className={`py-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                  simTenant === "blue"
                    ? "bg-blue-950 text-blue-300 border-blue-700"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                Tenant: Blue Team
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Requested Capability</label>
            <select
              value={simCapability}
              onChange={(e) => setSimCapability(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
            >
              <option value="model.inference">model.inference (Authorized Standard)</option>
              <option value="admin.reset">admin.reset (Unauthorized Privilege Probe)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Prompt Body</label>
            <textarea
              rows={3}
              value={simPrompt}
              onChange={(e) => setSimPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleSimulate}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
          >
            {isSubmitting ? "Evaluating Capability..." : "Send Request to Gateway"}
          </button>
        </div>

        {/* Right: Inspection Decision (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {latestSimResult ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  DECISION: {latestSimResult.id}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                    latestSimResult.status === "ALLOWED"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                      : "bg-rose-950 text-rose-300 border border-rose-700"
                  }`}
                >
                  {latestSimResult.status}
                </span>
              </div>

              <div className="text-xs font-mono text-slate-300">
                <strong>Reason:</strong> {latestSimResult.reason}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">TENANT CACHE SALT</div>
                  <div className="text-cyan-300 truncate mt-1">{latestSimResult.cacheSalt}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">POLICY VERSION</div>
                  <div className="text-slate-200 mt-1">{latestSimResult.policyVersion}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">LATENCY</div>
                  <div className="text-slate-200 mt-1">{latestSimResult.latencyMs}ms</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center text-xs text-slate-400 font-mono">
              <Zap className="h-8 w-8 text-cyan-400/40 mb-2" />
              <span>Submit a test request from the simulator to inspect live gateway capability authorization.</span>
            </div>
          )}

          {/* Gateway Traffic Stream */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-xs font-mono text-slate-400 uppercase font-semibold mb-3">
              Live Gateway Request Telemetry
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Req ID</th>
                    <th className="py-2 px-3">Tenant</th>
                    <th className="py-2 px-3">Capability</th>
                    <th className="py-2 px-3">Cache Salt</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {gatewayRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="py-2.5 px-3 font-semibold text-white">{req.id}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.tenant === "red" ? "bg-rose-950 text-rose-400 border border-rose-800" : "bg-blue-950 text-blue-400 border border-blue-800"}`}>
                          {req.tenant.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{req.capability}</td>
                      <td className="py-2.5 px-3 text-cyan-300 truncate max-w-[120px]">{req.cacheSalt}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.status === "ALLOWED" ? "text-emerald-400" : "text-rose-400"}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
