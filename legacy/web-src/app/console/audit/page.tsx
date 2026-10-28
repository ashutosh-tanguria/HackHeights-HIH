"use client";

import { useState } from "react";
import { useBayora } from "@/lib/bayora-store";
import {
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  AlertTriangle,
  Lock,
  Layers,
  Terminal,
  Hash,
} from "lucide-react";

export default function AuditPage() {
  const {
    auditEvents,
    verifyAuditChainAction,
    tamperAuditBlockAction,
    restoreAuditChainAction,
    auditVerificationReport,
    evaluations,
    activeEvaluationId,
  } = useBayora();

  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const activeEval = evaluations.find((e) => e.id === activeEvaluationId) || evaluations[0];

  const handleVerify = async () => {
    const report = await verifyAuditChainAction();
    if (report.isValid) {
      setVerifyMessage("Cryptographic verification passed. All SHA-256 hashes match linear predecessor chain.");
    } else {
      setVerifyMessage(`INTEGRITY FAILURE: Block #${report.brokenIndex} does not match computed hash! Audit tampering detected.`);
    }
  };

  const handleExportCapsule = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeEval.reproducibilityCapsule, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bayora-capsule-${activeEval.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-xs font-mono font-bold border border-emerald-800">
              MOMENT 3: VERIFIED
            </span>
            <span className="text-xs text-slate-400 font-mono">CRYPTOGRAPHIC FORENSICS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <FileCheck className="h-6 w-6 text-emerald-400" />
            <span>Forensic Audit Trail & Cryptographic Hash Chain</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Every boundary test, gateway invocation, and policy decision is linked in an immutable SHA-256 linear hash chain sealed with an offline Ed25519 root signature.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerify}
            className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Verify Audit Chain</span>
          </button>

          <button
            onClick={handleExportCapsule}
            className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Capsule</span>
          </button>
        </div>
      </div>

      {/* Verification Status Alert */}
      {verifyMessage && (
        <div
          className={`p-4 rounded-xl border font-mono text-xs flex items-center gap-3 ${
            auditVerificationReport.isValid
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
              : "bg-rose-950/80 border-rose-800 text-rose-300"
          }`}
        >
          {auditVerificationReport.isValid ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{verifyMessage}</span>
        </div>
      )}

      {/* Interactive Tampering Demo Controls */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Hash className="h-4 w-4 text-cyan-400" />
              <span>Interactive Tampering Proof Demo</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate an adversary attempting to modify an event record in the database. Watch cryptographic verification immediately fail at the exact tampered block.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => tamperAuditBlockAction(3)}
              className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-mono text-xs font-semibold transition-colors"
            >
              Tamper Block #3
            </button>
            <button
              onClick={restoreAuditChainAction}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Restore Clean Chain</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Hash Chain Blocks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase font-semibold">
          <span>Linear Audit Blocks ({auditEvents.length} Sealed Events)</span>
          <span className="text-cyan-400">Formula: H_i = SHA256(H_(i-1) || payload_i)</span>
        </div>

        <div className="space-y-3">
          {auditEvents.map((evt, idx) => (
            <div
              key={evt.eventId}
              className={`p-4 rounded-xl border font-mono text-xs transition-all ${
                evt.isTampered
                  ? "bg-rose-950/40 border-rose-600 shadow-lg shadow-rose-950/40"
                  : "bg-slate-900/80 border-slate-800"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-400 font-bold border border-slate-800 text-[11px]">
                    BLOCK #{evt.index}
                  </span>
                  <span className="text-white font-bold">{evt.eventId}</span>
                  <span className="text-slate-400">• {evt.actor.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-400">{evt.timestamp}</span>
                  {evt.isTampered ? (
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold border border-rose-700 animate-pulse">
                      TAMPERED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                      VALID
                    </span>
                  )}
                </div>
              </div>

              <div className="text-slate-300 font-sans text-xs mb-3">
                {evt.payloadSummary}
              </div>

              {/* Hash Link Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="truncate">
                  <span className="text-slate-500">PREV HASH:</span> <span className="text-slate-400">{evt.previousHash}</span>
                </div>
                <div className="truncate">
                  <span className="text-slate-500">CURR HASH:</span> <span className="text-emerald-400 font-bold">{evt.currentHash}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
