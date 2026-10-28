"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Agents",
    href: "/agents",
  },
  {
    label: "Scenarios",
    href: "/scenarios",
  },
  {
    label: "Test Runs",
    href: "/runs",
  },
  {
    label: "Failures",
    href: "/failures",
  },
  {
    label: "Reliability",
    href: "/reliability",
  },
  {
    label: "Regressions",
    href: "/regressions",
  },
  {
    label: "Copilot",
    href: "/copilot",
  },
  {
    label: "Settings",
    href: "/settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <Link
          href="/dashboard"
          className="font-semibold tracking-tight"
        >
          OOSC Reliability
        </Link>
      </div>

      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}