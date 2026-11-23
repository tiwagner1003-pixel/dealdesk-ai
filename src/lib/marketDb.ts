import type { Peer } from "./types";

export type TickerInfo = {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  subSector: string;
  ccy: string;
  price: number;
  prevClose: number;
  mktCap: number;        // in millions
  netDebt: number;
  shares: number;
  revenue: number;
  ebitda: number;
  pe: number;
  evEbitda: number;
  evRev: number;
  beta: number;
  divYield: number;
  range52w: [number, number];
  priv?: boolean;
};

/**
 * Seed catalogue of ~40 companies used for ticker search, watchlist,
 * peer auto-fill and dashboard demos. Each row carries realistic stats.
 *
 * The /api/market-data route gives you current prices on demand via
 * configured free data providers. Merge those responses into these seed
 * rows before rendering market-facing UI.
 */
export const MARKET_DB: TickerInfo[] = [
  // Adyen, Stand 23.11.2026: Umsatz und EBITDA aus dem Geschäftsjahr 2025 (Netto-Umsatz 2.364,2 Mio. €,
  // EBITDA 1.245,7 Mio. €, Ergebnis rund 1.063 Mio. €), Kurs und 52-Wochen-Spanne von Yahoo am selben Tag,
  // rund 31,7 Mio. Aktien, operative Liquidität rund 4,6 Mrd. € (ohne Händlerguthaben).
  { ticker: "ADYEN.AS", name: "Adyen",        exchange: "AMS",  sector: "FinTech",   subSector: "Payments",      ccy: "EUR", price: 821.80,  prevClose: 793.50,  mktCap: 26050, netDebt: -4600, shares: 31.7, revenue: 2364,  ebitda: 1246, pe: 24.5, evEbitda: 17.2, evRev: 9.1, beta: 1.42, divYield: 0,    range52w: [772.4, 1485] },
  { ticker: "PYPL",     name: "PayPal",       exchange: "NSDQ", sector: "FinTech",   subSector: "Payments",      ccy: "USD", price: 72.18,   prevClose: 71.84,   mktCap: 73200, netDebt: -2400, shares: 1014, revenue: 31200, ebitda: 7488, pe: 17.4, evEbitda: 9.8,  evRev: 2.4, beta: 1.31, divYield: 0,    range52w: [55.5, 88.2] },
  { ticker: "SQ",       name: "Block",        exchange: "NYSE", sector: "FinTech",   subSector: "Payments",      ccy: "USD", price: 92.45,   prevClose: 90.20,   mktCap: 56800, netDebt: 1100,  shares: 615,  revenue: 21800, ebitda: 3924, pe: 32.1, evEbitda: 12.6, evRev: 1.8, beta: 2.18, divYield: 0,    range52w: [54.2, 102.7] },
  { ticker: "WISE.L",   name: "Wise",         exchange: "LON",  sector: "FinTech",   subSector: "Payments",      ccy: "GBP", price: 1042.0,  prevClose: 1028.5,  mktCap: 10800, netDebt: -780,  shares: 1037, revenue: 1170,  ebitda: 374,  pe: 22.8, evEbitda: 19.4, evRev: 6.2, beta: 1.18, divYield: 0,    range52w: [612, 1098] },
  { ticker: "NEXI.MI",  name: "Nexi",         exchange: "MIL",  sector: "FinTech",   subSector: "Payments",      ccy: "EUR", price: 6.84,    prevClose: 6.92,    mktCap: 8650,  netDebt: 5100,  shares: 1265, revenue: 3450,  ebitda: 1725, pe: 14.2, evEbitda: 8.7,  evRev: 3.1, beta: 1.05, divYield: 0,    range52w: [4.92, 8.14] },
  { ticker: "WLN.PA",   name: "Worldline",    exchange: "PAR",  sector: "FinTech",   subSector: "Payments",      ccy: "EUR", price: 8.92,    prevClose: 9.04,    mktCap: 2520,  netDebt: 3200,  shares: 282,  revenue: 4610,  ebitda: 1244, pe: 9.4,  evEbitda: 5.9,  evRev: 1.4, beta: 1.62, divYield: 0,    range52w: [2.84, 12.6] },

  { ticker: "MSFT",     name: "Microsoft",    exchange: "NSDQ", sector: "Software",  subSector: "Cloud & AI",    ccy: "USD", price: 478.20,  prevClose: 474.10,  mktCap: 3550000, netDebt: -78000, shares: 7420, revenue: 261800, ebitda: 130900, pe: 36.4, evEbitda: 26.5, evRev: 13.3, beta: 0.92, divYield: 0.7, range52w: [402, 498] },
  { ticker: "NVDA",     name: "NVIDIA",       exchange: "NSDQ", sector: "Semis",     subSector: "AI Compute",    ccy: "USD", price: 142.80,  prevClose: 138.60,  mktCap: 3510000, netDebt: -28000, shares: 24580, revenue: 130500, ebitda: 84800, pe: 60.4, evEbitda: 41.1, evRev: 26.7, beta: 1.78, divYield: 0,    range52w: [85.4, 153.1] },
  { ticker: "CRM",      name: "Salesforce",   exchange: "NYSE", sector: "Software",  subSector: "CRM / SaaS",    ccy: "USD", price: 318.60,  prevClose: 314.20,  mktCap: 305000, netDebt: -8200,  shares: 957,  revenue: 37800, ebitda: 11340, pe: 42.6, evEbitda: 26.2, evRev: 7.8, beta: 1.24, divYield: 0.5, range52w: [212, 348] },
  { ticker: "SNOW",     name: "Snowflake",    exchange: "NYSE", sector: "Software",  subSector: "Data Cloud",    ccy: "USD", price: 168.40,  prevClose: 165.10,  mktCap: 56400, netDebt: -3800,  shares: 335,  revenue: 3640,  ebitda: 218,  pe: 0,    evEbitda: 0,    evRev: 14.4, beta: 1.05, divYield: 0,    range52w: [108, 198] },
  { ticker: "DDOG",     name: "Datadog",      exchange: "NSDQ", sector: "Software",  subSector: "Observability", ccy: "USD", price: 162.20,  prevClose: 158.90,  mktCap: 55200, netDebt: -2900,  shares: 340,  revenue: 2680,  ebitda: 432,  pe: 84.2, evEbitda: 32.6, evRev: 19.5, beta: 1.18, divYield: 0,    range52w: [108, 178] },
  { ticker: "CRWD",     name: "CrowdStrike",  exchange: "NSDQ", sector: "Software",  subSector: "Cybersecurity", ccy: "USD", price: 384.50,  prevClose: 378.20,  mktCap: 93800, netDebt: -3400,  shares: 244,  revenue: 3950,  ebitda: 728,  pe: 92.6, evEbitda: 35.8, evRev: 22.8, beta: 1.21, divYield: 0,    range52w: [212, 412] },
  { ticker: "PLTR",     name: "Palantir",     exchange: "NYSE", sector: "Software",  subSector: "Data Analytics",ccy: "USD", price: 78.40,   prevClose: 76.20,   mktCap: 178000, netDebt: -4100, shares: 2270, revenue: 2880,  ebitda: 715,  pe: 168.4,evEbitda: 38.4, evRev: 24.8, beta: 1.82, divYield: 0,    range52w: [22.1, 88.6] },

  { ticker: "AAPL",     name: "Apple",        exchange: "NSDQ", sector: "Hardware",  subSector: "Consumer Tech", ccy: "USD", price: 232.60,  prevClose: 230.40,  mktCap: 3520000, netDebt: 64000,  shares: 15140, revenue: 391200, ebitda: 131500, pe: 32.4, evEbitda: 24.5, evRev: 8.4, beta: 1.21, divYield: 0.4, range52w: [164, 240] },
  { ticker: "GOOGL",    name: "Alphabet",     exchange: "NSDQ", sector: "Software",  subSector: "Search & Ads",  ccy: "USD", price: 198.20,  prevClose: 196.40,  mktCap: 2450000, netDebt: -82000, shares: 12370, revenue: 318100, ebitda: 113200, pe: 24.6, evEbitda: 18.4, evRev: 7.4, beta: 1.06, divYield: 0.3, range52w: [148, 208] },
  { ticker: "AMZN",     name: "Amazon",       exchange: "NSDQ", sector: "Retail",    subSector: "eCom / Cloud",  ccy: "USD", price: 228.40,  prevClose: 224.20,  mktCap: 2410000, netDebt: 38000,  shares: 10570, revenue: 620200, ebitda: 124000, pe: 48.2, evEbitda: 19.6, evRev: 3.8, beta: 1.18, divYield: 0,    range52w: [148, 244] },
  { ticker: "META",     name: "Meta",         exchange: "NSDQ", sector: "Software",  subSector: "Social & Ads",  ccy: "USD", price: 612.40,  prevClose: 608.10,  mktCap: 1550000, netDebt: -52000, shares: 2530, revenue: 162800, ebitda: 81400, pe: 28.4, evEbitda: 18.4, evRev: 9.2, beta: 1.31, divYield: 0.3, range52w: [432, 638] },
  { ticker: "TSLA",     name: "Tesla",        exchange: "NSDQ", sector: "Auto",      subSector: "EV / Energy",   ccy: "USD", price: 348.20,  prevClose: 342.10,  mktCap: 1110000, netDebt: -28000, shares: 3190, revenue: 98300, ebitda: 14140, pe: 142.8,evEbitda: 76.5, evRev: 11.0, beta: 2.18, divYield: 0,    range52w: [138, 388] },

  { ticker: "SAP.DE",   name: "SAP",          exchange: "FRA",  sector: "Software",  subSector: "Enterprise",    ccy: "EUR", price: 246.80,  prevClose: 244.10,  mktCap: 288000, netDebt: 6800,  shares: 1170, revenue: 33800, ebitda: 8460, pe: 48.4, evEbitda: 34.8, evRev: 8.7, beta: 0.96, divYield: 0.9, range52w: [168, 256] },
  { ticker: "ASML.AS",  name: "ASML",         exchange: "AMS",  sector: "Semis",     subSector: "Litho Equip.",  ccy: "EUR", price: 712.40,  prevClose: 698.20,  mktCap: 280000, netDebt: -12800, shares: 393,  revenue: 28200, ebitda: 9870, pe: 36.4, evEbitda: 27.1, evRev: 9.5, beta: 1.42, divYield: 0.9, range52w: [560, 1020] },
  { ticker: "SIE.DE",   name: "Siemens",      exchange: "FRA",  sector: "Industrial",subSector: "Industrial Tech",ccy:"EUR", price: 192.40,  prevClose: 190.10,  mktCap: 154000, netDebt: 14000,  shares: 800,  revenue: 75600, ebitda: 11340, pe: 17.4, evEbitda: 14.8, evRev: 2.2, beta: 1.24, divYield: 2.4, range52w: [152, 198] },
  { ticker: "MC.PA",    name: "LVMH",         exchange: "PAR",  sector: "Luxury",    subSector: "Luxury Goods",  ccy: "EUR", price: 642.80,  prevClose: 638.40,  mktCap: 322000, netDebt: 9800,   shares: 501,  revenue: 84200, ebitda: 25260, pe: 24.2, evEbitda: 13.2, evRev: 3.9, beta: 1.18, divYield: 1.8, range52w: [566, 798] },
  { ticker: "OR.PA",    name: "L'Oréal",      exchange: "PAR",  sector: "Consumer",  subSector: "Beauty",        ccy: "EUR", price: 384.20,  prevClose: 380.60,  mktCap: 206000, netDebt: 2400,   shares: 537,  revenue: 41200, ebitda: 9890, pe: 31.6, evEbitda: 21.0, evRev: 5.1, beta: 0.84, divYield: 1.7, range52w: [322, 462] },
  { ticker: "NOVO-B.CO",name: "Novo Nordisk", exchange: "CPH",  sector: "Pharma",    subSector: "Pharma",        ccy: "DKK", price: 728.40,  prevClose: 718.20,  mktCap: 3250000, netDebt: -78000, shares: 4460, revenue: 245800, ebitda: 122900, pe: 28.4, evEbitda: 25.8, evRev: 12.9, beta: 0.42, divYield: 1.2, range52w: [488, 1042] },

  { ticker: "JPM",      name: "JPMorgan",     exchange: "NYSE", sector: "Banks",     subSector: "Universal Bank",ccy: "USD", price: 242.80,  prevClose: 240.40,  mktCap: 678000, netDebt: 0,     shares: 2790, revenue: 168200, ebitda: 84100, pe: 13.4, evEbitda: 8.1,  evRev: 4.0, beta: 1.06, divYield: 2.1, range52w: [188, 248] },
  { ticker: "GS",       name: "Goldman Sachs",exchange: "NYSE", sector: "Banks",     subSector: "Investment Bank",ccy:"USD", price: 612.40,  prevClose: 608.20,  mktCap: 192000, netDebt: 0,     shares: 314,  revenue: 51800, ebitda: 18800, pe: 16.2, evEbitda: 10.2, evRev: 3.7, beta: 1.32, divYield: 2.0, range52w: [438, 642] },
  { ticker: "BLK",      name: "BlackRock",    exchange: "NYSE", sector: "AssetMgmt", subSector: "Asset Manager", ccy: "USD", price: 1078.20, prevClose: 1068.40, mktCap: 162000, netDebt: -8400, shares: 150,  revenue: 21200, ebitda: 9540, pe: 24.4, evEbitda: 16.2, evRev: 7.3, beta: 1.18, divYield: 1.9, range52w: [768, 1108] },

  { ticker: "STRIPE",   name: "Stripe",       exchange: "PRIV", sector: "FinTech",   subSector: "Payments",      ccy: "USD", price: 0, prevClose: 0, mktCap: 91500, netDebt: -2800, shares: 0, revenue: 22800, ebitda: 6840, pe: 0, evEbitda: 13.0, evRev: 3.9, beta: 0, divYield: 0, range52w: [0, 0], priv: true },
  { ticker: "KLARN.IPO",name: "Klarna",       exchange: "PRIV", sector: "FinTech",   subSector: "BNPL",          ccy: "USD", price: 0, prevClose: 0, mktCap: 14800, netDebt: 420,   shares: 0, revenue: 2280,  ebitda: 184,  pe: 0, evEbitda: 82.6, evRev: 6.7, beta: 0, divYield: 0, range52w: [0, 0], priv: true },
  { ticker: "OPENAI",   name: "OpenAI",       exchange: "PRIV", sector: "Software",  subSector: "AI Lab",        ccy: "USD", price: 0, prevClose: 0, mktCap: 152000, netDebt: 0,     shares: 0, revenue: 4800,  ebitda: -3200, pe: 0, evEbitda: 0, evRev: 31.7, beta: 0, divYield: 0, range52w: [0, 0], priv: true },

  { ticker: "XOM",      name: "ExxonMobil",   exchange: "NYSE", sector: "Energy",    subSector: "Integrated Oil",ccy: "USD", price: 118.40, prevClose: 117.60, mktCap: 522000, netDebt: 18000, shares: 4410, revenue: 348200, ebitda: 76600, pe: 13.8, evEbitda: 7.1, evRev: 1.6, beta: 0.96, divYield: 3.2, range52w: [98, 124] },
  { ticker: "LLY",      name: "Eli Lilly",    exchange: "NYSE", sector: "Pharma",    subSector: "Pharma",        ccy: "USD", price: 812.40,  prevClose: 802.10,  mktCap: 768000, netDebt: 18000, shares: 945,  revenue: 48200, ebitda: 16870, pe: 78.4, evEbitda: 46.6, evRev: 16.3, beta: 0.42, divYield: 0.7, range52w: [612, 968] },
  { ticker: "BABA",     name: "Alibaba",      exchange: "NYSE", sector: "Retail",    subSector: "eCom / Cloud",  ccy: "USD", price: 108.40,  prevClose: 106.20,  mktCap: 258000, netDebt: -68000, shares: 2380, revenue: 142600, ebitda: 28520, pe: 18.2, evEbitda: 6.7,  evRev: 1.3, beta: 0.62, divYield: 0.9, range52w: [72, 124] },
];

/* ────────────────────────────────────────────────────────────────
   Seeded price series — stable per ticker (no live API needed)
   For current prices, hit /api/market-data and merge the result.
   ──────────────────────────────────────────────────────────────── */
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function priceSeries(t: TickerInfo, range: "1D" | "1M" | "1Y" | "5Y" = "1Y"): number[] {
  const N = range === "1D" ? 78 : range === "1M" ? 22 : range === "5Y" ? 60 : 250;
  const seed = (t.ticker || "ABC").split("").reduce((a, c) => a + c.charCodeAt(0) * 17, 1);
  const rng = seededRand(seed);
  const drift = range === "1D" ? 0.0003 : range === "5Y" ? 0.0006 : 0.0008;
  const vol = range === "1D" ? 0.004 : range === "5Y" ? 0.025 : 0.018;
  const start = t.price ? t.price * (range === "1D" ? 0.997 : range === "1M" ? 0.92 : range === "1Y" ? 0.78 : 0.42) : 100;
  const arr: number[] = [];
  let p = start;
  for (let i = 0; i < N; i++) {
    const r = (rng() - 0.5) * 2;
    p = p * (1 + drift + r * vol);
    arr.push(p);
  }
  if (t.price) {
    arr[arr.length - 1] = t.price;
  }
  return arr;
}

/* ────────────────────────────────────────────────────────────────
   Auto-fill peers from MARKET_DB by sector + size similarity
   ──────────────────────────────────────────────────────────────── */
/**
 * Branchen, die als Vergleich noch taugen, wenn die eigene zu dünn besetzt ist.
 * Bewusst knapp: Ein Halbleiterhersteller ist kein Vergleich für Apple, eine Bank
 * keiner für einen Ölkonzern.
 */
const NAHE_BRANCHEN: Record<string, string[]> = {
  Luxury: ["Consumer"], Consumer: ["Luxury"],
  Banks: ["AssetMgmt"], AssetMgmt: ["Banks"],
  Semis: ["Hardware"], Hardware: ["Semis"],
};

/** Unter dieser Zahl ist ein Median kein Median — dann zählt nur der DCF. */
export const MIN_PEERS = 2;

/**
 * Vergleichsunternehmen aus derselben oder einer nahen Branche. Bis zum
 * 23.11.2026 füllte die Auswahl fehlende Branchenpeers mit beliebigen Firmen
 * ähnlicher Größe auf — Exxon wurde an JPMorgan und SAP gemessen und landete bei
 * +228 %. Lieber keine Comps als falsche: Reicht die Branche nicht für
 * MIN_PEERS, stehen die Kandidaten in der Tabelle, zählen aber nicht.
 */
export function suggestPeers(t: TickerInfo | undefined, n = 5): Peer[] {
  if (!t) return [];
  const nah = NAHE_BRANCHEN[t.sector] ?? [];
  const candidates = MARKET_DB.filter((p) =>
    p.ticker !== t.ticker && !p.priv && (p.sector === t.sector || nah.includes(p.sector)));
  const scored = candidates.map((p) => {
    let score = 0;
    if (p.sector === t.sector) score += 10;
    if (p.subSector === t.subSector) score += 6;
    const sizeRatio = Math.min(p.mktCap, t.mktCap) / Math.max(p.mktCap, t.mktCap);
    score += sizeRatio * 4;
    return { ...p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const auswahl = scored.slice(0, n);
  const genug = auswahl.length >= MIN_PEERS;
  return auswahl.map((p) => ({
    included: genug,
    name: p.name,
    ticker: p.ticker,
    revenueGrowth: p.subSector.includes("AI") || p.subSector.includes("Data Cloud") ? 28 : p.subSector.includes("Payment") ? 11 : 8,
    ebitdaMargin: p.ebitda > 0 ? Math.round((p.ebitda / p.revenue) * 100) : 15,
    evRevenue: p.evRev,
    evEbitda: p.evEbitda > 0 ? p.evEbitda : 14,
  }));
}

export function findTicker(symbol: string | undefined): TickerInfo | undefined {
  if (!symbol) return undefined;
  return MARKET_DB.find((t) => t.ticker === symbol.toUpperCase());
}
