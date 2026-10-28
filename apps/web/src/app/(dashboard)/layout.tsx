import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="fixed inset-y-0 left-0 w-64 border-r bg-white">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            OOSC Reliability
          </Link>
        </div>

        <nav className="space-y-1 p-4">
          <Link
            href="/dashboard"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Dashboard
          </Link>

          <Link
            href="/agents"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Agents
          </Link>

          <Link
            href="/scenarios"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Scenarios
          </Link>

          <Link
            href="/runs"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Test Runs
          </Link>

          <Link
            href="/failures"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Failures
          </Link>

          <Link
            href="/reliability"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Reliability
          </Link>

          <Link
            href="/regressions"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Regressions
          </Link>

          <Link
            href="/settings"
            className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Settings
          </Link>
        </nav>
      </aside>

      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-slate-900 border-slate-800 px-8 text-white">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm tracking-wide text-cyan-400">BAYORA</span>
            <span className="text-xs text-slate-400">Legacy Reliability Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/console/overview"
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-1.5 shadow"
            >
              <span>Launch Security Console →</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}