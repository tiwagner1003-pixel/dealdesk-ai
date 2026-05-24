import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealDesk AI",
  description: "Finance analyst workbench for modeling, valuation, peers, and investment memos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
