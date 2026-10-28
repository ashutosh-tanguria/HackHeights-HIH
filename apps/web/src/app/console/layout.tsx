"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useApi } from "@/lib/api-client";
import type { Overview } from "@/lib/types";
import { Badge } from "@/components/ui";

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ICONS: Record<string, ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  probes: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  eval: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  side: <path d="M2 12h4l3-8 4 16 3-8h6" />,
  audit: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  access: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  threat: <path d="M12 3l9 16H3L12 3zM12 10v4M12 17v.5" />,
};

const NAV = [
  { href: "/console", label: "Overview", icon: "overview" },
  { href: "/console/probes", label: "Isolation probes", icon: "probes" },
  { href: "/console/evaluation", label: "Evaluation", icon: "eval" },
  { href: "/console/side-channel", label: "Side-channel", icon: "side" },
  { href: "/console/audit", label: "Audit", icon: "audit" },
  { href: "/console/access", label: "Access control", icon: "access" },
  { href: "/console/threat-model", label: "Threat model", icon: "threat" },
];

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { data, error } = useApi<Overview>("/api/v1/overview", { pollMs: 15000 });
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-[232px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-2)] px-3 py-5">
        <div className="mb-7 px-2">
          <div className="flex items-center gap-2.5">
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" className="text-[var(--accent)]"><g {...P}><path d="M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5l8-3z" /><path d="M9 12l2 2 4-4" /></g></svg>
            <span className="text-[20px] font-bold tracking-tight">Bayora</span>
          </div>
          <div className="mt-2 text-[11.5px] leading-snug text-[var(--muted)]">Communication is allowed; observation is not.</div>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Console">
          {NAV.map((n) => {
            const active = n.href === "/console" ? path === n.href : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-[14px] transition ${active ? "border-[var(--accent)] bg-[var(--accent-bg)] font-semibold text-[var(--accent)]" : "border-transparent text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--ink)]"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><g {...P}>{ICONS[n.icon]}</g></svg>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 text-xs">
          <div className="label mb-1.5">Target model</div>
          {error ? (
            <Badge tone="bad">API unreachable</Badge>
          ) : data ? (
            <>
              <div className="mono mb-2 break-all text-[var(--ink)]">{data.service.model}</div>
              <div className="flex flex-wrap gap-1">
                <Badge tone="neutral">{data.service.provider}</Badge>
                {data.service.isMock ? <Badge tone="mock">MOCK</Badge> : data.service.modelReachable ? <Badge tone="ok">reachable</Badge> : <Badge tone="bad">UNAVAILABLE</Badge>}
              </div>
            </>
          ) : (
            <div className="skeleton h-9" />
          )}
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-7 xl:px-10">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
