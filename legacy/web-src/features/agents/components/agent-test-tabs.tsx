"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AgentTestTabsProps = {
  agentId: string;
};

const tabs = [
  {
    label: "Overview",
    suffix: "",
  },
  {
    label: "Tests",
    suffix: "/tests",
  },
  {
    label: "Runs",
    suffix: "/runs",
  },
  {
    label: "Failures",
    suffix: "/failures",
  },
  {
    label: "Regression",
    suffix: "/regression",
  },
  {
    label: "Settings",
    suffix: "/settings",
  },
];

export function AgentTestTabs({
  agentId,
}: AgentTestTabsProps) {
  const pathname = usePathname();

  const basePath = `/agents/${agentId}`;

  return (
    <div className="border-b">
      <nav className="flex gap-6 overflow-x-auto">
        {tabs.map((tab) => {
          const href = `${basePath}${tab.suffix}`;

          const isActive =
            tab.suffix === ""
              ? pathname === basePath
              : pathname === href ||
                pathname.startsWith(`${href}/`);

          return (
            <Link
              key={tab.label}
              href={href}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-black text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}