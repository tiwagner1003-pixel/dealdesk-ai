import { NextRequest, NextResponse } from "next/server";

export type MarketDataResult = {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  // computed from model params if provided
  marketCap: number | null;
  impliedEv: number | null;
  impliedEvEbitda: number | null;
  impliedEvRevenue: number | null;
  // from Yahoo
  week52High: number;
  week52Low: number;
  dayHigh: number;
  dayLow: number;
  priceVs52wHigh: number;
  fetchedAt: string;
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const ticker = params.get("ticker")?.trim().toUpperCase();
  if (!ticker) {
    return NextResponse.json({ error: "ticker parameter is required" }, { status: 400 });
  }

  // Optional model params for computing live market multiples
  const shares = parseFloat(params.get("shares") ?? "0");      // shares outstanding in M
  const netDebt = parseFloat(params.get("netDebt") ?? "0");     // net debt in model currency
  const revenue = parseFloat(params.get("revenue") ?? "0");     // LTM revenue
  const ebitda = parseFloat(params.get("ebitda") ?? "0");       // LTM EBITDA

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://finance.yahoo.com",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Yahoo Finance returned ${res.status} for ${ticker}. Verify the ticker is a US/internationally listed symbol.` },
        { status: 502 }
      );
    }

    const json = await res.json() as Record<string, unknown>;
    const chart = json?.chart as Record<string, unknown> | undefined;
    const results = chart?.result as Record<string, unknown>[] | undefined;
    const result = results?.[0];
    const meta = result?.meta as Record<string, unknown> | undefined;

    if (!meta) {
      return NextResponse.json({ error: `No price data available for ${ticker}` }, { status: 404 });
    }

    const price = Number(meta.regularMarketPrice);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: `Invalid price data for ${ticker}` }, { status: 404 });
    }

    const week52High = Number(meta.fiftyTwoWeekHigh) || 0;
    const week52Low = Number(meta.fiftyTwoWeekLow) || 0;
    const priceVs52wHigh = week52High > 0 ? ((price / week52High) - 1) * 100 : 0;

    // Compute live market multiples if model params were passed
    let marketCap: number | null = null;
    let impliedEv: number | null = null;
    let impliedEvEbitda: number | null = null;
    let impliedEvRevenue: number | null = null;

    if (shares > 0) {
      marketCap = price * shares;
      impliedEv = marketCap + netDebt;
      if (revenue > 0) impliedEvRevenue = impliedEv / revenue;
      if (ebitda > 0) impliedEvEbitda = impliedEv / ebitda;
    }

    const data: MarketDataResult = {
      ticker,
      name: String(meta.longName || meta.shortName || ticker),
      price,
      currency: String(meta.currency || "USD"),
      marketCap,
      impliedEv,
      impliedEvEbitda,
      impliedEvRevenue,
      week52High,
      week52Low,
      dayHigh: Number(meta.regularMarketDayHigh) || 0,
      dayLow: Number(meta.regularMarketDayLow) || 0,
      priceVs52wHigh,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Market data fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
