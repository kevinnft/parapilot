import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ParaPilot Studio | Autonomous Agent Guardrails on Monad",
  description: "Non-custodial smart session keys and policy engine for AI agents on Monad.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-monad-purple selection:text-white">
        {children}
      </body>
    </html>
  );
}
