import type { Metadata } from "next";
import "./globals.css";
import { BayoraProvider } from "@/lib/bayora-store";

export const metadata: Metadata = {
  title: "BAYORA | Secure Adversarial AI Safety Testing Platform",
  description: "Trustworthy Infrastructure for AI Safety Testing. Policy-enforced sandbox isolation for Red Team, Blue Team, and Target LLM environments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        <BayoraProvider>{children}</BayoraProvider>
      </body>
    </html>
  );
}