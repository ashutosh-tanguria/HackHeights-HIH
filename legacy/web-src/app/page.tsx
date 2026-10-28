"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Cpu,
  Terminal,
  Activity,
  FileCheck,
  Layers,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Database,
  EyeOff,
  Flame,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const [selectedBoundary, setSelectedBoundary] = useState<"red_blue" | "red_target" | "kv_cache">("red_blue");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                BAYORA
              </span>
              <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono font-medium">
                AI SEC-INFRA
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#architecture" className="hover:text-cyan-400 transition-colors">
              Architecture
            </a>
            <a href="#isolation" className="hover:text-cyan-400 transition-colors">
              Isolation Stack
            </a>
            <a href="#side-channel" className="hover:text-cyan-400 transition-colors">
              Side-Channel Lab
            </a>
            <a href="#threat-matrix" className="hover:text-cyan-400 transition-colors">
              Threat Model
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/console/overview"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-sm shadow-md hover:from-cyan-400 hover:to-blue-500 transition-all hover:shadow-cyan-500/25"
            >
              <span>Launch Console</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))]" />
        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium mb-8 shadow-inner">
            <Activity className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
            <span>PS-04 CONCURRENT ADVERSARIAL AI TESTING INFRASTRUCTURE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Test the AI. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              Trust the Arena.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Don’t only test whether the LLM is safe. Test whether the environment performing the safety test is itself trustworthy.
            A policy-enforced multi-tenant platform preventing cross-tenant leakage, environment contamination, and KV-cache side-channels.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/console/overview"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-base shadow-xl shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-2"
            >
              <span>Launch Security Console</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#architecture"
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base transition-colors"
            >
              Explore 4-Plane Architecture
            </a>
          </div>

          {/* Quick Stats Banner */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur text-left">
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-cyan-400" />
                <span>ISOLATION BOUNDARY</span>
              </div>
              <div className="text-xl font-bold text-white mt-1">gVisor + CNI</div>
              <div className="text-xs text-slate-400 mt-0.5">AppKernel syscall sandbox</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur text-left">
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-blue-400" />
                <span>LLM PREFIX CACHE</span>
              </div>
              <div className="text-xl font-bold text-white mt-1">Per-Tenant Salt</div>
              <div className="text-xs text-slate-400 mt-0.5">vLLM timing channel killed</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur text-left">
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>EVIDENCE PROVENANCE</span>
              </div>
              <div className="text-xl font-bold text-white mt-1">SHA-256 Chain</div>
              <div className="text-xs text-slate-400 mt-0.5">Cryptographic tamper-evident</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur text-left">
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-amber-400" />
                <span>SIDE-CHANNEL AUC</span>
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-1">0.512 (Chance)</div>
              <div className="text-xs text-slate-400 mt-0.5">Down from 0.894 baseline</div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Interactive Architecture Preview */}
      <section id="architecture" className="py-20 border-b border-slate-800/60 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              SYSTEM ARCHITECTURE
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-white mt-2">
              Communication is Allowed. Observation is Not.
            </p>
            <p className="text-slate-400 mt-3 text-base">
              The danger is a flat Docker environment where Red and Blue can observe each other’s payloads, classifier states, or timing. Bayora mediates all capability through dedicated enforcement boundaries.
            </p>
          </div>

          {/* Interactive Topology Display */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Red Team Card */}
              <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-900/40 relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-400 border border-rose-800/60 text-xs font-mono font-bold">
                    RED TEAM
                  </span>
                  <span className="text-xs text-slate-400 font-mono">namespace: bayora-red</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Adversarial Runner</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Generates jailbreaks, GCG suffixes, and prompt injections from HarmBench & AdvBench.
                </p>
                <div className="mt-4 pt-4 border-t border-rose-900/30 text-xs space-y-1 font-mono text-slate-300">
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>POST /infer via Gateway</span>
                  </div>
                  <div className="text-rose-400 flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Cross-tenant Blue access blocked</span>
                  </div>
                </div>
              </div>

              {/* Central Gateway Card */}
              <div className="p-6 rounded-xl bg-cyan-950/30 border border-cyan-800/60 shadow-lg shadow-cyan-950/50 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[11px] font-mono tracking-wide uppercase">
                  INFERENCE GATEWAY
                </div>
                <div className="text-center my-2">
                  <div className="inline-flex p-3 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-2">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Capability & Policy Router</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Verifies tenant identity, token quotas, attaches tenant-scoped cache salt, and logs to audit chain.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-cyan-900/40 text-[11px] font-mono text-cyan-300/80 space-y-1 text-center">
                  <div>mTLS Verified • Per-tenant Salt Secret</div>
                  <div>Strict Token Budgeting & Redaction</div>
                </div>
              </div>

              {/* Blue Team Card */}
              <div className="p-6 rounded-xl bg-blue-950/20 border border-blue-900/40 relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded bg-blue-950 text-blue-400 border border-blue-800/60 text-xs font-mono font-bold">
                    BLUE TEAM
                  </span>
                  <span className="text-xs text-slate-400 font-mono">namespace: bayora-blue</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Defensive Mitigations</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Executes Llama-Guard 3, input sanitizers, canary traps, and semantic intent monitors.
                </p>
                <div className="mt-4 pt-4 border-t border-blue-900/30 text-xs space-y-1 font-mono text-slate-300">
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>POST /infer via Gateway</span>
                  </div>
                  <div className="text-rose-400 flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Red raw attack state invisible</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Model Row */}
            <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">TARGET LLM: vLLM (Llama-3-70B-Instruct)</div>
                  <div className="text-xs text-slate-400 font-mono">namespace: bayora-target • Ingress restricted strictly to Gateway</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-xs font-mono font-medium">
                  Direct Target Access: BLOCKED
                </span>
                <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-xs font-mono font-medium">
                  KV Salt: ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Plane Architecture Details */}
      <section id="isolation" className="py-20 border-b border-slate-800/60 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              DEFENSE IN DEPTH
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-white mt-2">
              The 4 Architectural Planes of Bayora
            </p>
            <p className="text-slate-400 mt-3 text-base">
              Each security property has a dedicated enforcement point: NetworkPolicy handles reachability, gVisor handles syscalls, the Gateway handles capabilities, and the Hash Chain handles auditability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="p-2.5 w-fit rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">1. Control Plane</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Manages reproducible evaluation capsules, compiles security contracts into K8s manifests, schedules workloads, and coordinates state.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono text-cyan-400">
                Next.js • Fastify • PostgreSQL • BullMQ
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="p-2.5 w-fit rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-4">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">2. Security Plane</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Enforces namespace boundaries, default-deny CNI network policies, non-root execution, dropped Linux capabilities, and gVisor application-kernel syscall intercept.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono text-rose-400">
                gVisor runsc • NetworkPolicy • seccomp • cgroups
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="p-2.5 w-fit rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 mb-4">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">3. Inference Plane</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Capability-mediated inference broker. Injects per-tenant cache salts, tracks evaluation token quotas, prevents direct target socket bypass, and isolates sessions.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono text-blue-400">
                Inference Gateway • vLLM • Cache Salt Engine
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="p-2.5 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-4">
                  <FileCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">4. Evidence Plane</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Constructs an immutable SHA-256 linear hash chain of all events, signs forensic checkpoints with Ed25519 root keys, and seals evaluation capsules.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono text-emerald-400">
                SHA-256 Hash Chain • Signed Checkpoints • OpenTelemetry
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 3 Moments: BLOCKED, MEASURED, VERIFIED */}
      <section id="side-channel" className="py-20 border-b border-slate-800/60 bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              THE THREE VISUAL MOMENTS
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-white mt-2">
              Blocked. Measured. Verified.
            </p>
            <p className="text-slate-400 mt-3 text-base">
              A competition-winning demonstration moves beyond claiming security tools are installed. Every claim is backed by an interactive experiment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-400 border border-rose-800 font-mono text-xs font-bold">
                  MOMENT 1
                </span>
                <span className="font-bold text-rose-400">BLOCKED</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Isolation Probes</h3>
              <p className="text-xs text-slate-400 mt-2">
                We trigger automated attacks: cross-tenant curl, direct model socket scans, procfs escape attempts, and fake canary secret theft. All 8 probes are deterministically blocked and logged.
              </p>
              <div className="mt-4 p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-rose-300 border border-slate-800">
                $ curl -m 2 10.244.2.42:8080<br />
                <span className="text-rose-400 font-bold">➔ DROPPED BY NETWORKPOLICY</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono text-xs font-bold">
                  MOMENT 2
                </span>
                <span className="font-bold text-cyan-400">MEASURED</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Side-Channel Lab</h3>
              <p className="text-xs text-slate-400 mt-2">
                We measure TTFT latency distributions when Blue is idle vs busy. Baseline shared cache leaks timing (AUC 0.894). Bayora’s per-tenant cache salting drops AUC to 0.512 (pure chance).
              </p>
              <div className="mt-4 p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800">
                Classifier AUC: 0.894 ➔ <span className="text-emerald-400 font-bold">0.512 (Neutralized)</span><br />
                <span className="text-slate-400">Mutual info: 0.03 bits (noise floor)</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-xs font-bold">
                  MOMENT 3
                </span>
                <span className="font-bold text-emerald-400">VERIFIED</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Tamper-Evident Audit</h3>
              <p className="text-xs text-slate-400 mt-2">
                Every event links into an SHA-256 hash chain. Live demo lets judges alter a single byte in a test event copy: the cryptographic verifier immediately detects the exact block tampering.
              </p>
              <div className="mt-4 p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-300 border border-slate-800">
                Chain Verification: <span className="text-emerald-400 font-bold">PASSED</span><br />
                Tamper Test: <span className="text-rose-400 font-bold">FAILED AT BLOCK #3</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Threat Matrix Section */}
      <section id="threat-matrix" className="py-20 border-b border-slate-800/60 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              HONEST THREAT MODEL
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-white mt-2">
              What Bayora Protects vs. Residual Risks
            </p>
            <p className="text-slate-400 mt-3 text-base">
              A serious security architecture acknowledges its boundaries. We clearly distinguish between solved logical isolation and physical hardware side-channels.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Threat Vector</th>
                  <th className="py-3.5 px-4">Enforced PoC Control</th>
                  <th className="py-3.5 px-4">Verification Experiment</th>
                  <th className="py-3.5 px-4">Residual Risk / Boundary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Cross-tenant direct network</td>
                  <td className="py-3 px-4 text-cyan-300">Default-deny Cilium NetworkPolicy</td>
                  <td className="py-3 px-4 text-emerald-400">TCP connection drop probe</td>
                  <td className="py-3 px-4 text-slate-400">Zero residual risk for direct L3/L4.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Container escape to host</td>
                  <td className="py-3 px-4 text-cyan-300">gVisor user-space application kernel</td>
                  <td className="py-3 px-4 text-emerald-400">Syscall interception probe</td>
                  <td className="py-3 px-4 text-slate-400">gVisor Sentry vulnerabilities; defense-in-depth.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Shared prefix-cache timing</td>
                  <td className="py-3 px-4 text-cyan-300">vLLM per-tenant cache salt keying</td>
                  <td className="py-3 px-4 text-emerald-400">TTFT idle/busy distribution test</td>
                  <td className="py-3 px-4 text-slate-400">Logical cache separated; sub-ms DRAM bus contention persists.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Model session contamination</td>
                  <td className="py-3 px-4 text-cyan-300">Context teardown & salt cycling</td>
                  <td className="py-3 px-4 text-emerald-400">Synthetic canary extraction check</td>
                  <td className="py-3 px-4 text-slate-400">Protects inference session; does not cover model weights.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Forensic record tampering</td>
                  <td className="py-3 px-4 text-cyan-300">Linear SHA-256 hash chain</td>
                  <td className="py-3 px-4 text-emerald-400">Tamper detection block verifier</td>
                  <td className="py-3 px-4 text-slate-400">Requires external public timestamp anchor for total immutability.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Explore the Security Console?
          </h2>
          <p className="mt-4 text-slate-400 text-lg">
            Interact with live sandbox probes, execute Red Team payloads, configure Blue Team defenses, inspect the Inference Gateway, and test the Side-Channel Lab.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/console/overview"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-lg shadow-xl shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-2"
            >
              <span>Launch Interactive Console</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-300">BAYORA</span> — Trustworthy Infrastructure for AI Safety Testing. PS-04 Solution Architecture.
          </div>
          <div className="flex items-center gap-4">
            <span>Deterministic Demo Simulation Mode</span>
            <span>•</span>
            <Link href="/console/overview" className="text-cyan-400 hover:underline">
              Enter Console
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}