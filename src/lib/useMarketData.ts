"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MarketData } from "./types";
import type { TickerInfo } from "./marketDb";

export type MarketAwareTicker = TickerInfo & {
  marketSource: MarketData["source"];
  marketStatus: MarketData["status"];
  fetchedAt?: string;
  marketError?: string;
};

type ModelParams = {
  shares?: number;
  netDebt?: number;
  revenue?: number;
  ebitda?: number;
};

function mergeMarketData(ticker: TickerInfo, data?: MarketData): MarketAwareTicker {
  if (!data) {
    return {
      ...ticker,
      marketSource: "Seed",
      marketStatus: ticker.priv ? "fallback" : "cached",
    };
  }

  return {
    ...ticker,
    name: data.name || ticker.name,
    price: data.price || ticker.price,
    prevClose: data.previousClose || ticker.prevClose,
    ccy: data.currency || ticker.ccy,
    mktCap: data.marketCap || ticker.mktCap,
    range52w: data.week52Low > 0 && data.week52High > 0 ? [data.week52Low, data.week52High] : ticker.range52w,
    marketSource: data.source,
    marketStatus: data.status,
    fetchedAt: data.fetchedAt,
  };
}

export function marketSourceLabel(ticker: Pick<MarketAwareTicker, "marketSource" | "marketStatus" | "fetchedAt">) {
  if (ticker.marketSource === "Seed") return "Sample prices";
  const mode = ticker.marketStatus === "live" ? "Live" : "Delayed";
  return `${mode} via ${ticker.marketSource}`;
}

export function useMarketQuotes(tickers: TickerInfo[]) {
  const symbols = useMemo(
    () => tickers.filter((ticker) => !ticker.priv).map((ticker) => ticker.ticker),
    [tickers]
  );
  const symbolKey = symbols.join(",");
  const [quotes, setQuotes] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!symbolKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market-data?tickers=${encodeURIComponent(symbolKey)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Market data refresh failed.");
      const rows = Array.isArray(body.data) ? body.data as MarketData[] : [];
      setQuotes(Object.fromEntries(rows.map((row) => [row.ticker, row])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Market data refresh failed.");
    } finally {
      setLoading(false);
    }
  }, [symbolKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mergedTickers = useMemo(
    () => tickers.map((ticker) => mergeMarketData(ticker, quotes[ticker.ticker])),
    [tickers, quotes]
  );

  return { tickers: mergedTickers, quotes, loading, error, refresh };
}

export function useMarketQuote(ticker: TickerInfo | undefined, params: ModelParams = {}) {
  const [quote, setQuote] = useState<MarketData | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paramsKey = JSON.stringify(params);

  const refresh = useCallback(async () => {
    if (!ticker || ticker.priv) return;
    setLoading(true);
    setError(null);
    try {
      const search = new URLSearchParams({ ticker: ticker.ticker });
      if (params.shares != null) search.set("shares", String(params.shares));
      if (params.netDebt != null) search.set("netDebt", String(params.netDebt));
      if (params.revenue != null) search.set("revenue", String(params.revenue));
      if (params.ebitda != null) search.set("ebitda", String(params.ebitda));
      const res = await fetch(`/api/market-data?${search.toString()}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Market data refresh failed.");
      setQuote(body as MarketData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Market data refresh failed.");
    } finally {
      setLoading(false);
    }
  }, [ticker, paramsKey]);

  useEffect(() => {
    setQuote(undefined);
    refresh();
  }, [refresh]);

  return {
    ticker: ticker ? mergeMarketData(ticker, quote) : undefined,
    quote,
    loading,
    error,
    refresh,
  };
}
