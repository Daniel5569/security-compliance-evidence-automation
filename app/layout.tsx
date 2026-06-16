import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Security Compliance Evidence Automation",
  description:
    "A synthetic compliance evidence operations console for controls, reviews, gaps, package readiness, and audit trails."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
