"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBayora } from "@/lib/bayora-store";
import {
  ShieldCheck,
  LayoutDashboard,
  FlaskConical,
  Boxes,
  Flame,
  Shield,
  Zap,
  Activity,
  Cpu,
  FileCheck,
  FileCode,
  AlertTriangle,
  Settings,
  RefreshCw,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  UserCheck,
} from "lucide-react";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const {
    activeEvaluationId,
    evaluations,
    activeRole,
    setActiveRole,
    demoPitchStep,
    setDemoPitchStep,
    runAllProbes,
    verifyAuditChainAction,
    resetDemoState,
    isSimulating,
    auditVerificationReport,
  } = useBayora();

  const activeEval = evaluations.find((e) => e.id === activeEvaluationId) || evaluations[0];

  const navItems = [
    { name: "Overview", href: "/console/overview", icon: LayoutDashboard },
    { name: "Evaluations", href: "/console/evaluations", icon: FlaskConical },
    { name: "Sandbox & Isolation", href: "/console/sandbox", icon: Boxes },
    { name: "Red Team", href: "/console/red-team", icon: Flame },
    { name: "Blue Team", href: "/console/blue-team", icon: Shield },
    { name: "Inference Gateway", href: "/console/gateway", icon: Zap },
    { name: "Side-Channel Lab", href: "/console/side-channel", icon: Activity },
    { name: "LLM Cache & Canaries", href: "/console/llm-security", icon: Cpu },
    { name: "Audit & Evidence", href: "/console/audit", icon: FileCheck },
    { name: "Security Policies", href: "/console/policies", icon: FileCode },
    { name: "Findings & Reports", href: "/console/findings", icon: AlertTriangle },
    { name: "Settings", href: "/console/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col justify-between">
        <div>
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 flex items-center justify-center border border-cyan-400/30 shadow-md shadow-cyan-500/10">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-wider text-base text-white">BAYORA</span>
                <span className="text-[9px] font-mono text-cyan-400 -mt-1 tracking-tight">SECURE AI ARENA</span>
              </div>
            </Link>
          </div>

          {/* Role Filter Banner */}
          <div className="px-4 py-2 border-b border-slate-900 bg-slate-900/40">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>VIEW ROLE</span>
              <span className="text-cyan-400 uppercase font-semibold">{activeRole.replace("_", " ")}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
              <button
                onClick={() => setActiveRole("admin")}
                className={`py-1 rounded text-center transition-colors ${activeRole === "admin" ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold" : "bg-slate-900 text-slate-400 hover:text-slate-200"}`}
              >
                Admin
              </button>
              <button
                onClick={() => setActiveRole("red_team")}
                className={`py-1 rounded text-center transition-colors ${activeRole === "red_team" ? "bg-rose-950 text-rose-300 border border-rose-700/60 font-bold" : "bg-slate-900 text-slate-400 hover:text-slate-200"}`}
              >
                Red
              </button>
              <button
                onClick={() => setActiveRole("blue_team")}
                className={`py-1 rounded text-center transition-colors ${activeRole === "blue_team" ? "bg-blue-950 text-blue-300 border border-blue-700/60 font-bold" : "bg-slate-900 text-slate-400 hover:text-slate-200"}`}
              >
                Blue
              </button>
              <button
                onClick={() => setActiveRole("auditor")}
                className={`py-1 rounded text-center transition-colors ${activeRole === "auditor" ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold" : "bg-slate-900 text-slate-400 hover:text-slate-200"}`}
              >
                Audit
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-250px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/console/overview" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80">
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
            <div className="flex items-center justify-between">
              <span>CHAIN INTEGRITY</span>
              {auditVerificationReport.isValid ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="h-3 w-3" /> VERIFIED
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1 font-bold">
                  <XCircle className="h-3 w-3" /> BROKEN
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">
              {auditVerificationReport.isValid ? "SHA-256 linear chain intact" : `Tamper at block #${auditVerificationReport.brokenIndex}`}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between gap-4">
          {/* Environment Label & Eval Status */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px] font-mono font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>DEMO ENVIRONMENT</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
              <span>ACTIVE EVAL:</span>
              <span className="text-white font-semibold">{activeEval.id}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] uppercase font-bold border border-emerald-800/60">
                {activeEval.status}
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={runAllProbes}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-mono font-semibold transition-colors disabled:opacity-50"
              title="Execute all 8 boundary security tests"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{isSimulating ? "Testing..." : "Run Probes"}</span>
            </button>

            <button
              onClick={verifyAuditChainAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-mono font-semibold transition-colors"
              title="Cryptographically verify SHA-256 hash chain"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Verify Chain</span>
            </button>

            <button
              onClick={resetDemoState}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono transition-colors"
              title="Reset state to initial seed values"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </header>

        {/* Guided Demo Pitch Walkthrough Bar */}
        <div className="h-10 flex-shrink-0 bg-slate-900/90 border-b border-slate-800/80 px-6 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-cyan-400 font-bold">7-MIN PITCH FLOW:</span>
            <span>Step {demoPitchStep} of 6</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Link
              href="/console/overview"
              onClick={() => setDemoPitchStep(1)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${demoPitchStep === 1 ? "bg-cyan-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              1. Overview
            </Link>
            <Link
              href="/console/sandbox"
              onClick={() => setDemoPitchStep(2)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${demoPitchStep === 2 ? "bg-rose-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              2. BLOCKED (Probes)
            </Link>
            <Link
              href="/console/gateway"
              onClick={() => setDemoPitchStep(3)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${demoPitchStep === 3 ? "bg-cyan-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              3. Gateway
            </Link>
            <Link
              href="/console/blue-team"
              onClick={() => setDemoPitchStep(4)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${demoPitchStep === 4 ? "bg-blue-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              4. Blue Defense
            </Link>
            <Link
              href="/console/side-channel"
              onClick={() => setDemoPitchStep(5)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${demoPitchStep === 5 ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              5. MEASURED (Lab)
            </Link>
            <Link
              href="/console/audit"
              onClick={() => setDemoPitchStep(6)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${demoPitchStep === 6 ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              6. VERIFIED (Audit)
            </Link>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
