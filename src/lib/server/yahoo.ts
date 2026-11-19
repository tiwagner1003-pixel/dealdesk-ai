/**
 * Yahoo-Finance-Abruf über die Chart-Schnittstelle. Sie liefert in einem Zug
 * den aktuellen Kurs (meta) und die Schlusskurse des Zeitraums — dieselbe
 * Quelle für Kurs und Grafik, damit beide zusammenpassen.
 *
 * Yahoo sperrt Rechenzentrums-IPs fast durchgehend mit 429 (belegt im Log am
 * 19.11.2026: alle acht Watchlist-Titel, beide Hosts). Deshalb hält
 * `unstable_cache` jeden erfolgreichen Abruf fest: Ein Fehlschlag wirft und
 * wird nicht gespeichert, und bei einer Sperre während der Auffrischung bleibt
 * der letzte gute Stand stehen — mit seinem Zeitstempel, damit niemand einen
 * alten Kurs für einen aktuellen hält.
 */

import { unstable_cache } from "next/cache";

const HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://finance.yahoo.com",
};

export type YahooChart = {
  symbol: string;
  name: string;
  currency: string;
  price: number;
  dayHigh: number;
  dayLow: number;
  week52High: number;
  week52Low: number;
  /** Zeitpunkt des Kurses laut Yahoo, ISO. */
  asOf: string | null;
  /** Zeitstempel in Sekunden und Schlusskurse, ohne Lücken. */
  timestamps: number[];
  closes: number[];
};

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

class Gesperrt extends Error {}

export async function yahooChart(symbol: string, range: string, interval: string, revalidate: number): Promise<YahooChart | null> {
  const cached = unstable_cache(
    () => fetchChart(symbol, range, interval),
    ["yahoo-chart", symbol, range, interval],
    { revalidate },
  );
  try {
    return await cached();
  } catch (err) {
    if (!(err instanceof Gesperrt)) console.warn(`[yahoo] ${symbol} ${range} failed: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

async function fetchChart(symbol: string, range: string, interval: string): Promise<YahooChart | null> {
  let gesperrt = false;
  for (const host of HOSTS) {
    const url = `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    let res: Response;
    try {
      // Kein Fetch-Cache: der würde auch die 429-Antwort speichern.
      res = await fetch(url, { headers: HEADERS, cache: "no-store", signal: AbortSignal.timeout(6000) });
    } catch (err) {
      console.warn(`[yahoo] ${symbol} ${range} ${host} network error: ${err instanceof Error ? err.message : err}`);
      continue;
    }
    if (!res.ok) {
      console.warn(`[yahoo] ${symbol} ${range} ${host} HTTP ${res.status}`);
      gesperrt = true;
      continue;
    }
    let json: Record<string, unknown>;
    try {
      json = await res.json() as Record<string, unknown>;
    } catch {
      console.warn(`[yahoo] ${symbol} ${range} ${host} invalid JSON`);
      continue;
    }
    const chart = json.chart as Record<string, unknown> | undefined;
    const result = (chart?.result as Record<string, unknown>[] | undefined)?.[0];
    const meta = result?.meta as Record<string, unknown> | undefined;
    const price = num(meta?.regularMarketPrice);
    if (!meta || !price || price <= 0) {
      console.warn(`[yahoo] ${symbol} ${range} ${host} no price (${JSON.stringify(chart?.error ?? null)})`);
      return null; // Symbol unbekannt — der zweite Host weiß es auch nicht
    }

    const rawTs = (result?.timestamp as unknown[] | undefined) ?? [];
    const quote = ((result?.indicators as Record<string, unknown> | undefined)?.quote as Record<string, unknown>[] | undefined)?.[0];
    const rawClose = (quote?.close as unknown[] | undefined) ?? [];
    const timestamps: number[] = [];
    const closes: number[] = [];
    rawTs.forEach((t, i) => {
      const c = num(rawClose[i]);
      const ts = num(t);
      if (c != null && c > 0 && ts != null) { timestamps.push(ts); closes.push(c); }
    });

    return {
      symbol,
      name: String(meta.longName || meta.shortName || symbol),
      currency: String(meta.currency || "USD"),
      price,
      dayHigh: num(meta.regularMarketDayHigh) ?? 0,
      dayLow: num(meta.regularMarketDayLow) ?? 0,
      week52High: num(meta.fiftyTwoWeekHigh) ?? 0,
      week52Low: num(meta.fiftyTwoWeekLow) ?? 0,
      asOf: num(meta.regularMarketTime) ? new Date(num(meta.regularMarketTime)! * 1000).toISOString() : null,
      timestamps,
      closes,
    };
  }
  // Werfen statt null zurückgeben: Nur so speichert der Cache den Fehlschlag nicht.
  if (gesperrt) throw new Gesperrt(`${symbol} blocked`);
  throw new Error(`${symbol} unreachable`);
}

/** Höchstens `limit` Abrufe gleichzeitig — acht parallele Anfragen lösen bei Yahoo schneller eine Sperre aus. */
export async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
