import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const ui = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-ui", display: "swap" });
const code = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-code", display: "swap" });

export const metadata: Metadata = {
  title: "Bayora console",
  description: "Isolation, measurement and audit console for adversarial AI safety testing (Hack in Hills, PS-04)",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${ui.variable} ${code.variable}`}>
      <body>{children}</body>
    </html>
  );
}
