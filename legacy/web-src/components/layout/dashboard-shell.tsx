import type { ReactNode } from "react";
import { Sidebar } from "../ui/sidebar";
import { Header } from "./header";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />

      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <Header />

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}