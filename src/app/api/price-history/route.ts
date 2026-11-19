import { NextRequest, NextResponse } from "next/server";
import { yahooChart } from "@/lib/server/yahoo";

/** Echte Kursverläufe für die Grafik im Arbeitsbereich — kein Zufallspfad mehr. */
const RANGES: Record<string, { range: string; interval: string; revalidate: number }> = {
  "1D": { range: "1d", interval: "5m", revalidate: 300 },
  "1M": { range: "1mo", interval: "1d", revalidate: 900 },
  "1Y": { range: "1y", interval: "1d", revalidate: 3600 },
  "5Y": { range: "5y", interval: "1wk", revalidate: 21600 },
};

export async function GET(request: NextRequest) {
  const ticker = (request.nextUrl.searchParams.get("ticker") || "").trim().toUpperCase();
  const rangeKey = (request.nextUrl.searchParams.get("range") || "1Y").toUpperCase();
  const cfg = RANGES[rangeKey];
  if (!ticker || !cfg) {
    return NextResponse.json({ error: "ticker and range (1D, 1M, 1Y, 5Y) are required" }, { status: 400 });
  }

  const chart = await yahooChart(ticker, cfg.range, cfg.interval, cfg.revalidate);
  if (!chart || chart.closes.length < 2) {
    return NextResponse.json({ error: `No price history available for ${ticker}` }, { status: 404 });
  }

  return NextResponse.json({
    ticker,
    range: rangeKey,
    currency: chart.currency,
    timestamps: chart.timestamps,
    closes: chart.closes,
    source: "Yahoo Finance",
    asOf: chart.asOf,
  });
}
