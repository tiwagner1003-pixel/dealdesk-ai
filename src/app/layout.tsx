import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealDesk AI",
  description: "AI-powered valuation workbench — DCF, trading comps, and IC memos in one place.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
