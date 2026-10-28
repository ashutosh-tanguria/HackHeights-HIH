"use client";

import { useState } from "react";
import { useBayora } from "@/lib/bayora-store";
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  GitCompare,
  ArrowRight,
  Lock,
  Layers,
} from "lucide-react";

export default function FindingsPage() {
  const { findings, evaluations, activeEvaluationId } = useBayora();

  const [activeTab, setActiveTab] = useState<"findings" | "regression" | "executive_report">("findings");
  const [candidateVersion, setCandidateVersion] = useState<"clean" | "regressed">("clean");

  const activeEval = evaluations.find((e) => e.id === activeEvaluationId) || evaluations[0];

  const handleDownloadReport = () => {
    const reportData = {
      title: "BAYORA Executive AI Safety & Infrastructure Security Audit",
      evaluationId: activeEval.id,
      timestamp: new Date().toISOString(),
      findings: findings,
      metrics: activeEval.metrics,
      reproducibilityCapsule: activeEval.reproducibilityCapsule,
      compliance: {
        framework: "NIST AI RMF 1.0 & Generative AI Profile (NIST AI 600-1)",
        govern: "Policy-as-code & Immutable audit provenance",
        map: "Multi-tenant boundary threat modeling",
        measure: "Empirical side-channel AUC & canary tests",
        manage: "Automated regression CI/CD gates & capability mediation",
      },
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `bayora-security-report-${activeEval.id}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 text-xs font-mono font-bold border border-amber-800">
              AUDIT & REGRESSION
            </span>
            <span className="text-xs text-slate-400 font-mono">ASSESSMENT CENTER</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <span>Security Findings & Automated Regression Gate</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Detailed security findings across network, filesystem, and LLM-native threat surfaces, with automated CI/CD security regression gates blocking regressed deployments.
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <Download className="h-4 w-4" />
          <span>Export NIST Report</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("findings")}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === "findings"
              ? "bg-slate-900 text-cyan-400 border border-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Security Findings ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab("regression")}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "regression"
              ? "bg-slate-900 text-rose-400 border border-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <GitCompare className="h-3.5 w-3.5" />
          <span>CI/CD Regression Gate Demo</span>
        </button>
        <button
          onClick={() => setActiveTab("executive_report")}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "executive_report"
              ? "bg-slate-900 text-emerald-400 border border-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Executive Audit Report</span>
        </button>
      </div>

      {/* Tab 1: Findings */}
      {activeTab === "findings" && (
        <div className="space-y-4">
          {findings.map((f) => (
            <div
              key={f.id}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">{f.id}</span>
                  <span className="text-white font-bold text-base">{f.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      f.severity === "PASSED"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : f.severity === "HIGH"
                        ? "bg-amber-950 text-amber-400 border border-amber-800"
                        : "bg-rose-950 text-rose-400 border border-rose-800"
                    }`}
                  >
                    {f.severity}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {f.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {f.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-slate-800/80 text-slate-400">
                <div>
                  <strong className="text-slate-300">Affected Component:</strong> {f.affectedComponent}
                </div>
                <div className="truncate">
                  <strong className="text-slate-300">Evidence Hash:</strong> {f.evidenceHash}
                </div>
                <div className="md:col-span-2 text-[11px] text-amber-300/80">
                  <strong className="text-amber-400">Residual Risk Analysis:</strong> {f.residualRiskNotes}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Security Regression Gate */}
      {activeTab === "regression" && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-rose-400" />
                <span>Automated CI/CD Security Regression Gate</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates candidate pull-request against baseline security thresholds. Blocks merge if boundary enforcement or side-channel leakage regresses.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">Test Version:</span>
              <button
                onClick={() => setCandidateVersion("clean")}
                className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  candidateVersion === "clean"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                v3.1 (Clean Candidate)
              </button>
              <button
                onClick={() => setCandidateVersion("regressed")}
                className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  candidateVersion === "regressed"
                    ? "bg-rose-950 text-rose-300 border-rose-700"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                v3.2 (Regressed Candidate)
              </button>
            </div>
          </div>

          {/* Verdict Box */}
          <div
            className={`p-5 rounded-xl border font-mono text-xs space-y-2 ${
              candidateVersion === "clean"
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                : "bg-rose-950/60 border-rose-700 text-rose-300 shadow-xl shadow-rose-950/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                {candidateVersion === "clean" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-400 animate-pulse" />
                )}
                <span>
                  {candidateVersion === "clean"
                    ? "VERDICT: DEPLOYMENT ALLOWED (ALL CONTROLS PASSED)"
                    : "VERDICT: DEPLOYMENT BLOCKED — CRITICAL SECURITY REGRESSION DETECTED"}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-950 font-bold text-[10px]">
                CI/CD PIPELINE #8841
              </span>
            </div>
            <p className="font-sans text-xs text-slate-300">
              {candidateVersion === "clean"
                ? "All 5 security invariants satisfied. Zero delta on cross-tenant network isolation, side-channel AUC at 0.512, and clean session reset canary."
                : "Candidate branch introduced direct socket bypass rule in NetworkPolicy and removed per-tenant cache salt, causing Side-Channel AUC to jump from 0.512 to 0.841! Automated deployment halted."}
            </p>
          </div>

          {/* Delta Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Security Metric</th>
                  <th className="py-2.5 px-3">Baseline (Main)</th>
                  <th className="py-2.5 px-3">Candidate PR</th>
                  <th className="py-2.5 px-3">Required Threshold</th>
                  <th className="py-2.5 px-3">Gate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-3 px-3 font-semibold text-white">Cross-Tenant Network Probes</td>
                  <td className="py-3 px-3 text-emerald-400">100% BLOCKED</td>
                  <td className="py-3 px-3">
                    {candidateVersion === "clean" ? (
                      <span className="text-emerald-400">100% BLOCKED</span>
                    ) : (
                      <span className="text-rose-400 font-bold">FAILED (1 Allowed)</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400">Zero tolerance (0 allowed)</td>
                  <td className="py-3 px-3">
                    {candidateVersion === "clean" ? (
                      <span className="text-emerald-400 font-bold">PASSED</span>
                    ) : (
                      <span className="text-rose-400 font-bold">BLOCKER</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-white">Side-Channel Classifier AUC</td>
                  <td className="py-3 px-3 text-emerald-400">0.512 (Chance)</td>
                  <td className="py-3 px-3">
                    {candidateVersion === "clean" ? (
                      <span className="text-emerald-400">0.514 (Chance)</span>
                    ) : (
                      <span className="text-rose-400 font-bold">0.841 (Regressed)</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400">AUC &lt; 0.550</td>
                  <td className="py-3 px-3">
                    {candidateVersion === "clean" ? (
                      <span className="text-emerald-400 font-bold">PASSED</span>
                    ) : (
                      <span className="text-rose-400 font-bold">BLOCKER</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-white">Post-Reset Context Canary</td>
                  <td className="py-3 px-3 text-emerald-400">Clean Slate</td>
                  <td className="py-3 px-3">
                    {candidateVersion === "clean" ? (
                      <span className="text-emerald-400">Clean Slate</span>
                    ) : (
                      <span className="text-rose-400 font-bold">Canary Leaked</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400">Zero token recall</td>
                  <td className="py-3 px-3">
                    {candidateVersion === "clean" ? (
                      <span className="text-emerald-400 font-bold">PASSED</span>
                    ) : (
                      <span className="text-rose-400 font-bold">BLOCKER</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-white">Audit Linear Hash Chain</td>
                  <td className="py-3 px-3 text-emerald-400">Verified Sealed</td>
                  <td className="py-3 px-3 text-emerald-400">Verified Sealed</td>
                  <td className="py-3 px-3 text-slate-400">Unbroken linear chain</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">PASSED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Executive NIST AI RMF Report */}
      {activeTab === "executive_report" && (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 font-sans">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-cyan-400 font-bold">NIST AI RMF 1.0 ASSESSMENT REPORT</div>
              <h2 className="text-xl font-bold text-white mt-1">
                Bayora Multi-Tenant Adversarial AI Safety Infrastructure
              </h2>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <div>Evaluation Ref: {activeEval.id}</div>
              <div className="text-emerald-400 font-bold">STATUS: COMPLIANT & ISOLATED</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-2">
              <h3 className="font-bold text-white font-mono uppercase text-cyan-400">1. Executive Summary</h3>
              <p>
                Bayora establishes an airtight, capability-mediated operational arena for simultaneous Red Team attack generation and Blue Team defensive refinement. By isolating tenants in separate Kubernetes namespaces backed by gVisor user-space application kernels and default-deny Cilium NetworkPolicies, cross-tenant compromise is structurally impossible.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-white font-mono uppercase text-cyan-400">2. Empirical Side-Channel Mitigations</h3>
              <p>
                Shared LLM prefix caching was tested quantitatively. Enabling per-tenant cache salting successfully drove binary prediction AUC down from 0.894 (high timing exposure) to 0.512 (chance noise floor), neutralizing prefix-cache inference channels.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
            <div className="text-cyan-400 font-bold">NIST AI 600-1 GENERATIVE AI PROFILE ALIGNMENT:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
              <div>• <strong>GOVERN 1.2:</strong> Formal policy compiler eliminating config drift.</div>
              <div>• <strong>MAP 2.4:</strong> Multi-tenant LLM cache side-channel threat mapped.</div>
              <div>• <strong>MEASURE 3.1:</strong> Empirical TTFT latency variance quantified.</div>
              <div>• <strong>MANAGE 4.3:</strong> Automated regression gate blocking insecure PRs.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
