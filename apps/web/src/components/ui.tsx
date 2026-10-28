"use client";
import type { ReactNode } from "react";

type Tone = "ok" | "warn" | "bad" | "neutral" | "mock";

const TONES: Record<Tone, string> = {
  ok: "text-[var(--ok)] bg-[var(--ok-bg)] border-[color:rgba(74,222,128,0.35)]",
  warn: "text-[var(--warn)] bg-[var(--warn-bg)] border-[color:rgba(251,191,36,0.35)]",
  bad: "text-[var(--bad)] bg-[var(--bad-bg)] border-[color:rgba(248,113,113,0.4)]",
  mock: "text-[var(--mock)] bg-[var(--mock-bg)] border-[color:rgba(251,191,36,0.35)]",
  neutral: "text-[var(--muted)] bg-[rgba(147,161,181,0.1)] border-[var(--line-2)]",
};

export function Badge({ tone = "neutral", children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function SourceBadge({ source }: { source: "measured" | "simulated" | "MEASURED" | "MOCK" }) {
  const real = source === "measured" || source === "MEASURED";
  return real ? <Badge tone="ok" title="Produced by a real model run on this machine">MEASURED</Badge> : <Badge tone="mock" title="No real model attached: not a measurement">{source === "MOCK" ? "MOCK" : "SIMULATED"}</Badge>;
}

export function Banner({ tone = "warn", title, children }: { tone?: "warn" | "bad" | "mock" | "ok"; title: string; children?: ReactNode }) {
  const cls = {
    warn: "border-[var(--warn)] bg-[var(--warn-bg)]",
    bad: "border-[var(--bad)] bg-[var(--bad-bg)]",
    mock: "border-[var(--mock)] bg-[var(--mock-bg)]",
    ok: "border-[var(--ok)] bg-[var(--ok-bg)]",
  }[tone];
  return (
    <div role="alert" className={`mb-4 rounded-md border-l-4 px-4 py-3 ${cls}`}>
      <div className="font-semibold">{title}</div>
      {children ? <div className="mt-1 text-[13.5px] text-[var(--ink)]/90">{children}</div> : null}
    </div>
  );
}

export function Card({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="card mb-5 rounded-xl border border-[var(--line)] bg-[var(--panel)]">
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-5 py-3">
          <h2 className="label !text-[12px]">{title}</h2>
          <div className="flex items-center gap-2">{right}</div>
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-[130px]">
      <div className="label">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-[var(--muted)]">{sub}</div> : null}
    </div>
  );
}

/** Large tile used for headline numbers. */
export function Kpi({ label, value, sub, tone = "neutral" }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "neutral" | "ok" | "bad" | "accent" }) {
  const c = { neutral: "var(--ink)", ok: "var(--ok)", bad: "var(--bad)", accent: "var(--accent)" }[tone];
  return (
    <div className="card rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-4">
      <div className="label">{label}</div>
      <div className="mt-2 text-[34px] font-bold leading-none tabular-nums" style={{ color: c }}>{value}</div>
      {sub ? <div className="mt-2 text-xs tabular-nums text-[var(--muted)]">{sub}</div> : null}
    </div>
  );
}

export function Button({ children, onClick, disabled, kind = "primary" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; kind?: "primary" | "ghost" | "danger" }) {
  const base = "rounded-md px-3.5 py-2 text-[13px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const cls = {
    primary: "bg-[var(--accent)] text-[#04201c] hover:brightness-110",
    ghost: "border border-[var(--line-2)] bg-transparent text-[var(--ink)] hover:bg-[var(--panel-2)]",
    danger: "bg-[var(--bad)] text-[#2a0606] hover:brightness-110",
  }[kind];
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${cls}`}>
      {children}
    </button>
  );
}

export function PageHeader({ title, tagline, children }: { title: string; tagline: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
      <div className="max-w-[760px]">
        <h1 className="text-[30px] font-bold leading-tight">{title}</h1>
        <p className="mt-1 text-[var(--muted)]">{tagline}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Skeleton({ className = "h-24" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** Standard loading / error handling so every page treats API failures the same way. */
export function Async({ loading, error, children }: { loading: boolean; error: string | null; children: ReactNode }) {
  const unreachable = error?.startsWith("Network error") || error?.startsWith("HTTP 5") || error?.includes("fetch failed");
  return (
    <>
      {error ? <Banner tone="bad" title={unreachable ? "API unreachable" : "API error"}>{error}</Banner> : null}
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading from the API">
          <Skeleton className="h-28" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        children
      )}
    </>
  );
}

export const pct = (x: number | null | undefined, d = 1) => (x === null || x === undefined ? "n/a" : `${(x * 100).toFixed(d)}%`);
export const num = (x: number | null | undefined, d = 3) => (x === null || x === undefined ? "n/a" : x.toFixed(d));
export const ci = (c: [number, number] | null | undefined, f: (x: number) => string) => (c ? `[${f(c[0])}, ${f(c[1])}]` : "n/a");
export const fmtTime = (iso: string) => new Date(iso).toLocaleString();
