import { NextRequest, NextResponse } from "next/server";

export type MarketDataResult = {
  ticker: string;
  name: string;
  price: number;
  previousClose: number | null;
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
  source: "Twelve Data" | "FMP" | "Yahoo Finance";
  status: "live" | "cached" | "fallback";
  fetchedAt: string;
};

type Quote = {
  ticker: string;
  name: string;
  price: number;
  previousClose: number | null;
  currency: string;
  marketCap: number | null;
  week52High: number;
  week52Low: number;
  dayHigh: number;
  dayLow: number;
  source: MarketDataResult["source"];
};

const CACHE_SECONDS = 300;

function asNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function computeResult(quote: Quote, params: { shares: number; netDebt: number; revenue: number; ebitda: number }): MarketDataResult {
  let marketCap = quote.marketCap;
  let impliedEv: number | null = null;
  let impliedEvEbitda: number | null = null;
  let impliedEvRevenue: number | null = null;

  if (params.shares > 0) {
    marketCap = quote.price * params.shares;
  }

  if (marketCap != null) {
    impliedEv = marketCap + params.netDebt;
    if (params.revenue > 0) impliedEvRevenue = impliedEv / params.revenue;
    if (params.ebitda > 0) impliedEvEbitda = impliedEv / params.ebitda;
  }

  return {
    ticker: quote.ticker,
    name: quote.name,
    price: quote.price,
    previousClose: quote.previousClose,
    currency: quote.currency,
    marketCap,
    impliedEv,
    impliedEvEbitda,
    impliedEvRevenue,
    week52High: quote.week52High,
    week52Low: quote.week52Low,
    dayHigh: quote.dayHigh,
    dayLow: quote.dayLow,
    priceVs52wHigh: quote.week52High > 0 ? ((quote.price / quote.week52High) - 1) * 100 : 0,
    source: quote.source,
    status: quote.source === "Twelve Data" ? "live" : "fallback",
    fetchedAt: new Date().toISOString(),
  };
}

function parseTwelveQuote(symbol: string, raw: Record<string, unknown>): Quote | null {
  if (raw.code || raw.status === "error") return null;
  const price = asNumber(raw.close ?? raw.price);
  if (!price || price <= 0) return null;
  const range = raw.fifty_two_week as Record<string, unknown> | undefined;
  return {
    ticker: String(raw.symbol || symbol).toUpperCase(),
    name: String(raw.name || raw.symbol || symbol),
    price,
    previousClose: asNumber(raw.previous_close),
    currency: String(raw.currency || "USD"),
    marketCap: null,
    week52High: asNumber(range?.high) || 0,
    week52Low: asNumber(range?.low) || 0,
    dayHigh: asNumber(raw.high) || 0,
    dayLow: asNumber(raw.low) || 0,
    source: "Twelve Data",
  };
}

async function fetchTwelveQuotes(symbols: string[]): Promise<Map<string, Quote>> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  const quotes = new Map<string, Quote>();
  if (!apiKey) return quotes;

  const symbolParam = symbols.map(encodeURIComponent).join(",");
  const url = `https://api.twelvedata.com/quote?symbol=${symbolParam}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
  if (!res.ok) return quotes;
  const json = await res.json() as Record<string, unknown>;

  for (const symbol of symbols) {
    const raw = symbols.length === 1 ? json : json[symbol] as Record<string, unknown> | undefined;
    if (!raw || typeof raw !== "object") continue;
    const quote = parseTwelveQuote(symbol, raw as Record<string, unknown>);
    if (quote) quotes.set(symbol, quote);
  }

  return quotes;
}

function parseFmpQuote(raw: Record<string, unknown>): Quote | null {
  const symbol = String(raw.symbol || "");
  const price = asNumber(raw.price);
  if (!symbol || !price || price <= 0) return null;
  const marketCapRaw = asNumber(raw.marketCap);
  return {
    ticker: symbol.toUpperCase(),
    name: String(raw.name || symbol),
    price,
    previousClose: asNumber(raw.previousClose),
    currency: String(raw.currency || "USD"),
    marketCap: marketCapRaw != null ? marketCapRaw / 1_000_000 : null,
    week52High: asNumber(raw.yearHigh) || 0,
    week52Low: asNumber(raw.yearLow) || 0,
    dayHigh: asNumber(raw.dayHigh) || 0,
    dayLow: asNumber(raw.dayLow) || 0,
    source: "FMP",
  };
}

async function fetchFmpQuotes(symbols: string[]): Promise<Map<string, Quote>> {
  const apiKey = process.env.FMP_API_KEY;
  const quotes = new Map<string, Quote>();
  if (!apiKey) return quotes;

  const symbolPath = symbols.map(encodeURIComponent).join(",");
  const url = `https://financialmodelingprep.com/api/v3/quote/${symbolPath}?apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
  if (!res.ok) return quotes;
  const json = await res.json() as unknown;
  const rows = Array.isArray(json) ? json : [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const quote = parseFmpQuote(row as Record<string, unknown>);
    if (quote) quotes.set(quote.ticker, quote);
  }
  return quotes;
}

async function fetchYahooQuote(symbol: string): Promise<Quote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Referer": "https://finance.yahoo.com",
    },
    next: { revalidate: CACHE_SECONDS },
  });

  if (!res.ok) return null;
  const json = await res.json() as Record<string, unknown>;
  const chart = json?.chart as Record<string, unknown> | undefined;
  const results = chart?.result as Record<string, unknown>[] | undefined;
  const result = results?.[0];
  const meta = result?.meta as Record<string, unknown> | undefined;
  if (!meta) return null;

  const price = asNumber(meta.regularMarketPrice);
  if (!price || price <= 0) return null;

  return {
    ticker: symbol,
    name: String(meta.longName || meta.shortName || symbol),
    price,
    previousClose: asNumber(meta.previousClose ?? meta.chartPreviousClose),
    currency: String(meta.currency || "USD"),
    marketCap: null,
    week52High: asNumber(meta.fiftyTwoWeekHigh) || 0,
    week52Low: asNumber(meta.fiftyTwoWeekLow) || 0,
    dayHigh: asNumber(meta.regularMarketDayHigh) || 0,
    dayLow: asNumber(meta.regularMarketDayLow) || 0,
    source: "Yahoo Finance",
  };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const symbols = (params.get("tickers") || params.get("ticker") || "")
    .split(",")
    .map((ticker) => ticker.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 25);

  if (symbols.length === 0) {
    return NextResponse.json({ error: "ticker or tickers parameter is required" }, { status: 400 });
  }

  const shares = parseFloat(params.get("shares") ?? "0");      // shares outstanding in M
  const netDebt = parseFloat(params.get("netDebt") ?? "0");     // net debt in model currency
  const revenue = parseFloat(params.get("revenue") ?? "0");     // LTM revenue
  const ebitda = parseFloat(params.get("ebitda") ?? "0");       // LTM EBITDA
  const modelParams = { shares, netDebt, revenue, ebitda };

  try {
    const twelveQuotes = await fetchTwelveQuotes(symbols);
    const missingAfterTwelve = symbols.filter((symbol) => !twelveQuotes.has(symbol));
    const fmpQuotes = await fetchFmpQuotes(missingAfterTwelve);
    const missingAfterFmp = missingAfterTwelve.filter((symbol) => !fmpQuotes.has(symbol));
    const yahooQuotes = new Map<string, Quote>();
    await Promise.all(missingAfterFmp.map(async (symbol) => {
      const quote = await fetchYahooQuote(symbol);
      if (quote) yahooQuotes.set(symbol, quote);
    }));

    const results = symbols
      .map((symbol) => twelveQuotes.get(symbol) || fmpQuotes.get(symbol) || yahooQuotes.get(symbol))
      .filter((quote): quote is Quote => Boolean(quote))
      .map((quote) => computeResult(quote, symbols.length === 1 ? modelParams : { shares: 0, netDebt: 0, revenue: 0, ebitda: 0 }));

    if (results.length === 0) {
      return NextResponse.json({ error: `No price data available for ${symbols.join(", ")}` }, { status: 404 });
    }

    return NextResponse.json(symbols.length === 1 ? results[0] : { data: results, fetchedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Market data fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
