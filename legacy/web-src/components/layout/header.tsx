import Link from "next/link";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-8">
      <div>
        <p className="text-sm font-medium">Agent Reliability</p>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Settings
        </Link>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
          A
        </div>
      </div>
    </header>
  );
}