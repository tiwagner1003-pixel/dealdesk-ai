import type { Metadata } from "next";
import "./globals.css";

const description =
  "Browser-based valuation workbench: five-year DCF, trading comps, LBO returns and an investment memo for listed and private companies, with Excel and PowerPoint export.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://dealdesk-ai-cyan.vercel.app"),
  title: {
    default: "DealDesk — valuation workbench for DCF, comps and LBO",
    template: "%s",
  },
  description,
  applicationName: "DealDesk",
  openGraph: {
    type: "website",
    siteName: "DealDesk",
    title: "DealDesk — valuation workbench",
    description,
  },
  twitter: { card: "summary_large_image", title: "DealDesk — valuation workbench", description },
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
