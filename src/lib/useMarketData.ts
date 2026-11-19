"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MarketData } from "./types";
import type { TickerInfo } from "./marketDb";

export type MarketAwareTicker = TickerInfo & {
  marketSource: MarketData["source"];
  marketStatus: MarketData["status"];
  fetchedAt?: string;
  marketError?: string;
  /** true, wenn Kurs und Verlauf von einer Quelle stammen und nicht aus dem Beispielkatalog. */
  live: boolean;
  /** Tägliche Schlusskurse des letzten Monats, nur bei echten Daten. */
  history: number[] | null;
  asOf: string | null;
};

type ModelParams = {
  shares?: number;
  netDebt?: number;
  revenue?: number;
  ebitda?: number;
};

/**
 * Alle abgeleiteten Größen aus EINEM Kurs: Börsenwert, Unternehmenswert und
 * Multiplikatoren müssen zum angezeigten Kurs passen. Vorher kamen Kurs (live)
 * und Multiplikatoren (Katalog) aus verschiedenen Zeitpunkten, und bei manchen
 * Titeln passten selbst die Katalogwerte nicht zueinander.
 */
function derive(ticker: TickerInfo, price: number, marketCap?: number | null): Pick<TickerInfo, "mktCap" | "pe" | "evEbitda" | "evRev"> {
  const scale = ticker.price > 0 ? price / ticker.price : 1;
  const mktCap = marketCap && marketCap > 0 ? marketCap : ticker.mktCap * scale;
  const ev = mktCap + ticker.netDebt;
  const evEbitda = ticker.ebitda > 0 ? ev / ticker.ebitda : 0;
  const evRev = ticker.revenue > 0 ? ev / ticker.revenue : ticker.evRev;
  return {
    mktCap,
    pe: ticker.pe > 0 ? ticker.pe * scale : ticker.pe,
    evEbitda: evEbitda > 0 && evEbitda < 500 ? evEbitda : 0,
    evRev,
  };
}

function mergeMarketData(ticker: TickerInfo, data?: MarketData): MarketAwareTicker {
  if (!data) {
    return {
      ...ticker,
      ...derive(ticker, ticker.price),
      marketSource: "Seed",
      marketStatus: ticker.priv ? "fallback" : "cached",
      live: false,
      history: null,
      asOf: null,
    };
  }

  const price = data.price || ticker.price;
  return {
    ...ticker,
    ...derive(ticker, price, data.marketCap),
    name: ticker.name,
    price,
    prevClose: data.previousClose || ticker.prevClose,
    ccy: data.currency || ticker.ccy,
    range52w: data.week52Low > 0 && data.week52High > 0 ? [data.week52Low, data.week52High] : ticker.range52w,
    marketSource: data.source,
    marketStatus: data.status,
    fetchedAt: data.fetchedAt,
    live: true,
    history: data.history && data.history.length > 1 ? data.history : null,
    asOf: data.asOf ?? null,
  };
}

/** Tageswechsel nur bei echten Daten — beim Beispielkatalog wäre er erfunden. */
export function dayChange(t: MarketAwareTicker): number | null {
  if (!t.live || !t.prevClose) return null;
  return ((t.price - t.prevClose) / t.prevClose) * 100;
}

export function formatAsOf(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function marketSourceLabel(ticker: Pick<MarketAwareTicker, "marketSource" | "marketStatus" | "fetchedAt" | "asOf">) {
  if (ticker.marketSource === "Seed") return "Sample prices";
  const when = formatAsOf(ticker.asOf);
  return `${ticker.marketSource}${when ? " · " + when : ""}`;
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

export type PriceRange = "1D" | "1M" | "1Y" | "5Y";
export type PriceHistory = { timestamps: number[]; closes: number[]; currency: string; asOf: string | null };

/** Echter Kursverlauf über /api/price-history. Liefert null, wenn keine Daten zu bekommen sind. */
export function usePriceHistory(ticker: string | undefined, range: PriceRange, enabled = true) {
  const [data, setData] = useState<PriceHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ticker || !enabled) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setData(null);
    fetch(`/api/price-history?ticker=${encodeURIComponent(ticker)}&range=${range}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        if (!cancelled) setData(body as PriceHistory);
      })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ticker, range, enabled]);

  return { data, loading, failed };
}
