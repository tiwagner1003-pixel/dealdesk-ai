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
  /**
   * Umsatzwachstum im laufenden Geschäftsjahr in Prozent: Analystenkonsens bei
   * Yahoo (23.11.2026), bei den handbelegten Zeilen das erste Jahr ihres Fallplans.
   * Zukäufe und Abgänge sind enthalten. Fehlt bei nicht börsennotierten Zeilen.
   */
  revGrowth?: number;
  priv?: boolean;
};

/**
 * Seed catalogue of ~80 companies used for ticker search, watchlist,
 * peer auto-fill and dashboard demos.
 *
 * Herkunft: Zeilen ohne eigenen Kommentar stammen von Yahoo Finance, Stand
 * 23.11.2026 — Kurs, Börsenwert, Umsatz und EBITDA der letzten zwölf Monate,
 * Nettoschulden als Finanzschulden minus Liquidität; EV/EBITDA und EV/Umsatz
 * daraus nachgerechnet, nicht übernommen. Wo Yahoo Börsenwert und Abschluss in
 * verschiedenen Währungen führt, steht der Umrechnungskurs an der Zeile.
 * Adyen, NVIDIA, ASML, Novo Nordisk, BlackRock und Snowflake sind von Hand aus
 * den Berichten gesetzt und tragen ihre Belege am Eintrag.
 *
 * The /api/market-data route gives you current prices on demand via
 * configured free data providers. Merge those responses into these seed
 * rows before rendering market-facing UI.
 */
export const MARKET_DB: TickerInfo[] = [
  // Adyen, Stand 23.11.2026: Umsatz und EBITDA aus dem Geschäftsjahr 2025 (Netto-Umsatz 2.364,2 Mio. €,
  // EBITDA 1.245,7 Mio. €, Ergebnis rund 1.063 Mio. €), Kurs und 52-Wochen-Spanne von Yahoo am selben Tag,
  // rund 31,7 Mio. Aktien, operative Liquidität rund 4,6 Mrd. € (ohne Händlerguthaben).
  { ticker: "ADYEN.AS", name: "Adyen",        exchange: "AMS",  sector: "FinTech",   subSector: "Payments",      ccy: "EUR", price: 821.80,  prevClose: 793.50,  mktCap: 26050, netDebt: -4600, shares: 31.7, revenue: 2364,  ebitda: 1246, pe: 24.5, evEbitda: 17.2, evRev: 9.1, revGrowth: 22, beta: 1.42, divYield: 0,    range52w: [772.4, 1485] },
  { ticker: "PYPL", name: "PayPal", exchange: "NSDQ", sector: "FinTech", subSector: "Payments", ccy: "USD", price: 54.495, prevClose: 53.29, mktCap: 45267, netDebt: 3971, shares: 830.7, revenue: 34295, ebitda: 6521, pe: 10.4, evEbitda: 7.6, evRev: 1.4, revGrowth: 4.1, beta: 1.32, divYield: 1.1, range52w: [38.46, 63.93] },
  { ticker: "XYZ", name: "Block", exchange: "NYSE", sector: "FinTech", subSector: "Payments", ccy: "USD", price: 72.775, prevClose: 69.66, mktCap: 43994, netDebt: -709, shares: 544.5, revenue: 25646, ebitda: 1575, pe: 95.8, evEbitda: 27.5, evRev: 1.7, revGrowth: 8.3, beta: 2.56, divYield: 0, range52w: [48.21, 89.39] },
  { ticker: "WISE.L", name: "Wise", exchange: "LON", sector: "FinTech", subSector: "Payments", ccy: "GBP", price: 8.486, prevClose: 8.316, mktCap: 8172, netDebt: -2687, shares: 963.0, revenue: 2772, ebitda: 1124, pe: 23.6, evEbitda: 7.1, evRev: 2.9, revGrowth: 20.6, beta: 1.59, divYield: 0, range52w: [7.54, 11.02] },  // Umsatz, EBITDA und Nettoschulden in USD, Börsenwert umgerechnet zum Kurs 1.3031
  { ticker: "NEXI.MI", name: "Nexi", exchange: "MIL", sector: "FinTech", subSector: "Payments", ccy: "EUR", price: 4.222, prevClose: 4.144, mktCap: 4960, netDebt: 4018, shares: 1174.7, revenue: 6322, ebitda: 1219, pe: 0, evEbitda: 7.4, evRev: 1.4, revGrowth: 1.5, beta: 1.08, divYield: 7.2, range52w: [2.64, 4.73] },
  { ticker: "WLN.PA", name: "Worldline", exchange: "PAR", sector: "FinTech", subSector: "Payments", ccy: "EUR", price: 8.484, prevClose: 8.073, mktCap: 480, netDebt: 1156, shares: 56.6, revenue: 3956, ebitda: 272, pe: 0, evEbitda: 6.0, evRev: 0.4, revGrowth: -7.4, beta: 1.93, divYield: 0, range52w: [7.65, 22.63] },

  { ticker: "MSFT", name: "Microsoft", exchange: "NSDQ", sector: "Software", subSector: "Cloud & AI", ccy: "USD", price: 498.505, prevClose: 484.52, mktCap: 3701995, netDebt: 69422, shares: 7426.2, revenue: 346445, ebitda: 205691, pe: 26.0, evEbitda: 18.3, evRev: 10.9, revGrowth: 19.3, beta: 1.04, divYield: 0.8, range52w: [349.2, 559.15] },
  // NVIDIA: GJ 2026 (bis 25.01.2026) Umsatz 215,9 Mrd. USD, operatives Ergebnis 130,4 Mrd.,
  // Abschreibungen 2,8 Mrd., EPS 4,90 USD. Bilanz zum 25.10.2026: Kasse und Wertpapiere
  // 97,7 Mrd. (davon 44,2 Mrd. börsennotierte Beteiligungen), Schulden 32,4 Mrd.;
  // 24,19 Mrd. Aktien verwässert. Kurs Yahoo 23.11.2026.
  { ticker: "NVDA",     name: "NVIDIA",       exchange: "NSDQ", sector: "Semis",     subSector: "AI Compute",    ccy: "USD", price: 168.27,  prevClose: 125.53,  mktCap: 4069778, netDebt: -65360, shares: 24186, revenue: 215938, ebitda: 133230, pe: 34.3, evEbitda: 30.1, evRev: 18.5, revGrowth: 96, beta: 1.78, divYield: 0,    range52w: [124.5, 243.37] },
  { ticker: "CRM", name: "Salesforce", exchange: "NYSE", sector: "Software", subSector: "CRM / SaaS", ccy: "USD", price: 183.875, prevClose: 180.62, mktCap: 151329, netDebt: 30973, shares: 823.0, revenue: 43938, ebitda: 12899, pe: 16.8, evEbitda: 14.1, evRev: 4.1, revGrowth: 11.5, beta: 1.23, divYield: 1.0, range52w: [146.32, 269.11] },
  // Snowflake: GJ 2026 (bis 31.01.2026) Umsatz 4.684 Mio. USD. EBITDA bereinigt, wie
  // Snowflake berichtet: operatives Ergebnis non-GAAP 490 Mio. plus Abschreibungen ohne
  // Übernahmen 110 Mio. — OHNE aktienbasierte Vergütung (1,6 Mrd., rund ein Drittel des
  // Umsatzes). Nach GAAP lag der operative Verlust bei 1,44 Mrd. Bilanz zum 31.07.2026:
  // Kasse und Anlagen 4,33 Mrd., Wandelanleihen 2,28 Mrd.; 377,9 Mio. Aktien verwässert
  // (non-GAAP, enthält die Verwässerung aus Aktienvergütung). Kurs Yahoo 23.11.2026.
  { ticker: "SNOW",     name: "Snowflake",    exchange: "NYSE", sector: "Software",  subSector: "Data Cloud",    ccy: "USD", price: 276.22,  prevClose: 254.82,  mktCap: 104384, netDebt: -2045,  shares: 377.9, revenue: 4684,  ebitda: 600,  pe: 0,    evEbitda: 170.6, evRev: 21.8, revGrowth: 34, beta: 1.05, divYield: 0,    range52w: [118.3, 384.56] },
  { ticker: "DDOG", name: "Datadog", exchange: "NSDQ", sector: "Software", subSector: "Observability", ccy: "USD", price: 167.6, prevClose: 157.37, mktCap: 60511, netDebt: -3926, shares: 337.3, revenue: 4278, ebitda: 170, pe: 232.8, evEbitda: 332.3, evRev: 13.2, revGrowth: 32.0, beta: 1.51, divYield: 0, range52w: [98.01, 300.68] },
  { ticker: "CRWD", name: "CrowdStrike", exchange: "NSDQ", sector: "Software", subSector: "Cybersecurity", ccy: "USD", price: 202.55, prevClose: 229.44, mktCap: 207398, netDebt: -4194, shares: 1023.9, revenue: 5396, ebitda: 107, pe: 3375.8, evEbitda: 1901.6, evRev: 37.7, revGrowth: 24.9, beta: 1.15, divYield: 0, range52w: [85.68, 286.99] },
  { ticker: "PLTR", name: "Palantir", exchange: "NSDQ", sector: "Software", subSector: "Data Analytics", ccy: "USD", price: 157.95, prevClose: 143.49, mktCap: 380580, netDebt: -10336, shares: 2306.7, revenue: 7288, ebitda: 3355, pe: 111.2, evEbitda: 110.3, evRev: 50.8, revGrowth: 91.1, beta: 1.61, divYield: 0, range52w: [106.37, 212.94] },

  { ticker: "AAPL", name: "Apple", exchange: "NSDQ", sector: "Hardware", subSector: "Consumer Tech", ccy: "USD", price: 349.4088, prevClose: 342.56, mktCap: 5077673, netDebt: 37757, shares: 14532.2, revenue: 478834, ebitda: 171486, pe: 38.9, evEbitda: 29.8, evRev: 10.7, revGrowth: 10.3, beta: 1.09, divYield: 0.3, range52w: [243.42, 360.83] },
  { ticker: "GOOGL", name: "Alphabet", exchange: "NSDQ", sector: "Internet", subSector: "Search & Ads", ccy: "USD", price: 282.25, prevClose: 265.29, mktCap: 3469982, netDebt: -114767, shares: 5888.0, revenue: 471098, ebitda: 185516, pe: 14.7, evEbitda: 18.1, evRev: 7.1, revGrowth: 24.0, beta: 1.23, divYield: 0.3, range52w: [264.22, 408.61] },
  { ticker: "AMZN", name: "Amazon", exchange: "NSDQ", sector: "Retail", subSector: "eCom / Cloud", ccy: "USD", price: 256.9, prevClose: 246.82, mktCap: 2777895, netDebt: 190615, shares: 10813.1, revenue: 797455, ebitda: 183719, pe: 20.8, evEbitda: 16.2, evRev: 3.7, revGrowth: 15.7, beta: 1.5, divYield: 0, range52w: [196.0, 287.2] },
  { ticker: "META", name: "Meta", exchange: "NSDQ", sector: "Internet", subSector: "Social & Ads", ccy: "USD", price: 592.91, prevClose: 560.84, mktCap: 1515621, netDebt: 32393, shares: 2214.5, revenue: 241605, ebitda: 116190, pe: 20.2, evEbitda: 13.3, evRev: 6.4, revGrowth: 27.8, beta: 1.28, divYield: 0.4, range52w: [520.26, 779.82] },
  { ticker: "TSLA", name: "Tesla", exchange: "NSDQ", sector: "Auto", subSector: "EV / Energy", ccy: "USD", price: 390.115, prevClose: 345.82, mktCap: 1542030, netDebt: -29002, shares: 3952.8, revenue: 103570, ebitda: 9838, pe: 428.7, evEbitda: 153.8, evRev: 14.6, revGrowth: 13.7, beta: 1.74, divYield: 0, range52w: [297.38, 498.83] },

  { ticker: "SAP.DE", name: "SAP", exchange: "FRA", sector: "Software", subSector: "Enterprise", ccy: "EUR", price: 186.54, prevClose: 183.68, mktCap: 215305, netDebt: -409, shares: 1154.2, revenue: 39387, ebitda: 12254, pe: 27.0, evEbitda: 17.5, evRev: 5.5, revGrowth: 9.9, beta: 0.7, divYield: 1.4, range52w: [127.5, 219.65] },
  // ASML: 2025 Umsatz 32.667 Mio. EUR, Ergebnis aus der Geschäftstätigkeit 11.301 Mio.
  // (34,6 %), Abschreibungen auf Sachanlagen 916 Mio. laut 20-F (Abschreibungen auf
  // immaterielle Werte nicht belegt, daher eher zu wenig EBITDA), EPS 24,73 EUR,
  // Dividende 7,50 EUR. Kasse und kurzfristige
  // Anlagen 12.735 Mio. zum Q3 2026; die Anleihen sind nicht belegt und nicht abgezogen.
  // 383 Mio. Aktien (Q3-Gewinn durch EPS). Kurs Yahoo 23.11.2026.
  { ticker: "ASML.AS",  name: "ASML",         exchange: "AMS",  sector: "Semis",     subSector: "Chip Equipment", ccy: "EUR", price: 1285.00, prevClose: 1168.00, mktCap: 492155, netDebt: -12735, shares: 383,  revenue: 32667, ebitda: 12217, pe: 52.0, evEbitda: 39.2, evRev: 14.7, revGrowth: 36, beta: 1.42, divYield: 0.6, range52w: [837.1, 1741] },
  { ticker: "SIE.DE", name: "Siemens", exchange: "FRA", sector: "Industrial", subSector: "Automation", ccy: "EUR", price: 265.7, prevClose: 254.65, mktCap: 203052, netDebt: 34316, shares: 764.2, revenue: 83372, ebitda: 14753, pe: 24.8, evEbitda: 16.1, evRev: 2.8, revGrowth: 9.5, beta: 1.34, divYield: 2.1, range52w: [198.0, 291.7] },
  { ticker: "MC.PA", name: "LVMH", exchange: "PAR", sector: "Luxury", subSector: "Luxury Goods", ccy: "EUR", price: 388.75, prevClose: 381.95, mktCap: 190732, netDebt: 24937, shares: 490.6, revenue: 79641, ebitda: 20054, pe: 17.7, evEbitda: 10.8, evRev: 2.7, revGrowth: -0.4, beta: 0.9, divYield: 3.4, range52w: [375.65, 654.3] },
  { ticker: "OR.PA", name: "L'Oréal", exchange: "PAR", sector: "Consumer", subSector: "Beauty", ccy: "EUR", price: 437.95, prevClose: 435.0, mktCap: 233565, netDebt: 12664, shares: 533.3, revenue: 45355, ebitda: 10350, pe: 37.2, evEbitda: 23.8, evRev: 5.4, revGrowth: 8.3, beta: 0.85, divYield: 1.7, range52w: [338.85, 455.75] },
  // Novo Nordisk: 2025 Umsatz 309.064 Mio. DKK, EBITDA 149.640 Mio. (mit rund 8 Mrd.
  // Umbaukosten), EPS 23,03 DKK, Dividende 11,70 DKK. Nettoverschuldung Ende 2025
  // 95.424 Mio. (seit der Catalent-Übernahme); 4.436 Mio. Aktien verwässert (9M 2026).
  // Kurs Yahoo 23.11.2026.
  { ticker: "NOVO-B.CO",name: "Novo Nordisk", exchange: "CPH",  sector: "Pharma",    subSector: "Pharma",        ccy: "DKK", price: 266.65,  prevClose: 264.50,  mktCap: 1182859, netDebt: 95424, shares: 4436, revenue: 309064, ebitda: 149640, pe: 11.6, evEbitda: 8.5, evRev: 4.1, revGrowth: 0, beta: 0.42, divYield: 4.4,  range52w: [224.25, 409.95] },

  { ticker: "JPM", name: "JPMorgan", exchange: "NYSE", sector: "Banks", subSector: "Universal Bank", ccy: "USD", price: 318.71, prevClose: 310.53, mktCap: 846369, netDebt: -256259, shares: 2655.6, revenue: 190733, ebitda: 0, pe: 13.4, evEbitda: 0, evRev: 3.1, revGrowth: 13.9, beta: 1.02, divYield: 2.1, range52w: [279.1, 366.5] },
  { ticker: "GS", name: "Goldman Sachs", exchange: "NYSE", sector: "Banks", subSector: "Investment Bank", ccy: "USD", price: 824.99, prevClose: 790.69, mktCap: 237956, netDebt: -213488, shares: 288.4, revenue: 71036, ebitda: 0, pe: 11.9, evEbitda: 0, evRev: 0.3, revGrowth: 26.3, beta: 1.27, divYield: 2.5, range52w: [775.36, 1153.99] },
  // BlackRock: 2025 Umsatz 24.216 Mio. USD, operatives Ergebnis „as adjusted“ 9.600 Mio.
  // (vor Abschreibung auf Übernahmen, also näher an EBITA als an EBITDA), EPS GAAP
  // 35,31 USD, Quartalsdividende 5,73 USD. Kasse 12.877 Mio. gegen Kredite 12.740 Mio.
  // zum 30.09.2026; 164,5 Mio. Aktien verwässert einschließlich Subco Units. Kurs Yahoo 23.11.2026.
  { ticker: "BLK",      name: "BlackRock",    exchange: "NYSE", sector: "AssetMgmt", subSector: "Asset Manager", ccy: "USD", price: 1155.88, prevClose: 1101.72, mktCap: 190142, netDebt: -137,  shares: 164.5, revenue: 24216, ebitda: 9600, pe: 32.7, evEbitda: 19.8, evRev: 7.8, revGrowth: 21, beta: 1.18, divYield: 2.0,  range52w: [917.39, 1242.12] },

  { ticker: "STRIPE",   name: "Stripe",       exchange: "PRIV", sector: "FinTech",   subSector: "Payments",      ccy: "USD", price: 0, prevClose: 0, mktCap: 91500, netDebt: -2800, shares: 0, revenue: 22800, ebitda: 6840, pe: 0, evEbitda: 13.0, evRev: 3.9, beta: 0, divYield: 0, range52w: [0, 0], priv: true },
  // Klarna ist seit dem 10.09.2025 an der NYSE notiert (KLAR); bis zum 23.11.2026 stand es hier
  // als privat. Yahoo, 23.11.2026. EBITDA negativ — als Kreditgeber ohnehin kein EV/EBITDA-Titel.
  { ticker: "KLAR", name: "Klarna", exchange: "NYSE", sector: "FinTech", subSector: "BNPL", ccy: "USD", price: 13.07, prevClose: 12.01, mktCap: 4971, netDebt: -1808, shares: 380.4, revenue: 4145, ebitda: -15, pe: 0, evEbitda: 0, evRev: 0.7, revGrowth: 18.5, beta: 0, divYield: 0, range52w: [11.97, 33.1] },
  { ticker: "OPENAI",   name: "OpenAI",       exchange: "PRIV", sector: "Software",  subSector: "AI Lab",        ccy: "USD", price: 0, prevClose: 0, mktCap: 152000, netDebt: 0,     shares: 0, revenue: 4800,  ebitda: -3200, pe: 0, evEbitda: 0, evRev: 31.7, beta: 0, divYield: 0, range52w: [0, 0], priv: true },

  { ticker: "XOM", name: "ExxonMobil", exchange: "NYSE", sector: "Energy", subSector: "Integrated Oil", ccy: "USD", price: 158.52, prevClose: 159.99, mktCap: 646638, netDebt: 22097, shares: 4079.2, revenue: 388232, ebitda: 77964, pe: 16.3, evEbitda: 8.6, evRev: 1.7, revGrowth: 31.3, beta: 0.14, divYield: 2.7, range52w: [114.19, 188.5] },
  { ticker: "LLY", name: "Eli Lilly", exchange: "NYSE", sector: "Pharma", subSector: "Pharma", ccy: "USD", price: 1375.46, prevClose: 1347.11, mktCap: 1225184, netDebt: 44618, shares: 890.7, revenue: 86462, ebitda: 46489, pe: 44.6, evEbitda: 27.3, evRev: 14.7, revGrowth: 40.7, beta: 0.39, divYield: 0.5, range52w: [850.51, 1475.25] },
  { ticker: "BABA", name: "Alibaba", exchange: "NYSE", sector: "Retail", subSector: "eCom / Cloud", ccy: "USD", price: 86.5427, prevClose: 81.08, mktCap: 215296, netDebt: -160032, shares: 2487.7, revenue: 1068695, ebitda: 128330, pe: 12.9, evEbitda: 9.9, evRev: 1.2, revGrowth: 9.0, beta: 0.4, divYield: 1.3, range52w: [80.96, 181.1] },  // Umsatz, EBITDA und Nettoschulden in CNY, Börsenwert umgerechnet zum Kurs 6.6539
  // Ergänzt am 23.11.2026, damit jede Branche der Beispielfälle eine Vergleichsgruppe hat.
  { ticker: "AMD", name: "AMD", exchange: "NSDQ", sector: "Semis", subSector: "AI Compute", ccy: "USD", price: 457.12, prevClose: 424.39, mktCap: 756564, netDebt: -6565, shares: 1655.1, revenue: 45436, ebitda: 11143, pe: 97.7, evEbitda: 67.3, evRev: 16.5, revGrowth: 50.8, beta: 2.54, divYield: 0, range52w: [188.22, 658.52] },
  { ticker: "AVGO", name: "Broadcom", exchange: "NSDQ", sector: "Semis", subSector: "AI Networking", ccy: "USD", price: 307.78, prevClose: 304.41, mktCap: 1469228, netDebt: 35444, shares: 4773.6, revenue: 89104, ebitda: 52260, pe: 39.3, evEbitda: 28.8, evRev: 16.9, revGrowth: 65.9, beta: 1.51, divYield: 0.9, range52w: [289.77, 495.0] },
  { ticker: "AMAT", name: "Applied Materials", exchange: "NSDQ", sector: "Semis", subSector: "Chip Equipment", ccy: "USD", price: 343.935, prevClose: 302.63, mktCap: 272946, netDebt: -2807, shares: 793.6, revenue: 34446, ebitda: 11919, pe: 27.3, evEbitda: 22.7, evRev: 7.8, revGrowth: 39.3, beta: 1.67, divYield: 0.7, range52w: [222.86, 739.67] },
  { ticker: "LRCX", name: "Lam Research", exchange: "NSDQ", sector: "Semis", subSector: "Chip Equipment", ccy: "USD", price: 208.72, prevClose: 183.27, mktCap: 260727, netDebt: -3702, shares: 1249.2, revenue: 26128, ebitda: 10116, pe: 31.1, evEbitda: 25.4, evRev: 9.8, revGrowth: 52.3, beta: 2.01, divYield: 0.7, range52w: [144.43, 438.5] },
  { ticker: "KLAC", name: "KLA", exchange: "NSDQ", sector: "Semis", subSector: "Chip Equipment", ccy: "USD", price: 142.655, prevClose: 126.87, mktCap: 185874, netDebt: 1251, shares: 1303.0, revenue: 14506, ebitda: 6580, pe: 35.8, evEbitda: 28.4, evRev: 12.9, revGrowth: 39.0, beta: 1.5, divYield: 0.7, range52w: [110.3, 307.37] },
  { ticker: "QCOM", name: "Qualcomm", exchange: "NSDQ", sector: "Semis", subSector: "Mobile Chips", ccy: "USD", price: 163.48, prevClose: 149.94, mktCap: 174924, netDebt: 8311, shares: 1070.0, revenue: 43120, ebitda: 10620, pe: 12.9, evEbitda: 17.3, evRev: 4.2, revGrowth: 5.0, beta: 1.76, divYield: 2.5, range52w: [121.99, 259.92] },
  { ticker: "IFX.DE", name: "Infineon", exchange: "FRA", sector: "Semis", subSector: "Analog & Power", ccy: "EUR", price: 49.135, prevClose: 45.44, mktCap: 63908, netDebt: 5188, shares: 1300.7, revenue: 16353, ebitda: 4110, pe: 43.1, evEbitda: 16.8, evRev: 4.2, revGrowth: 11.5, beta: 1.95, divYield: 0.8, range52w: [32.05, 88.83] },
  { ticker: "VOW3.DE", name: "Volkswagen", exchange: "FRA", sector: "Auto", subSector: "Volume OEM", ccy: "EUR", price: 63.16, prevClose: 62.62, mktCap: 31662, netDebt: 213690, shares: 206.2, revenue: 316622, ebitda: 28824, pe: 29.9, evEbitda: 8.5, evRev: 0.8, revGrowth: -1.4, beta: 0.96, divYield: 8.4, range52w: [61.62, 109.15] },
  { ticker: "BMW.DE", name: "BMW", exchange: "FRA", sector: "Auto", subSector: "Premium OEM", ccy: "EUR", price: 53.3, prevClose: 53.46, mktCap: 31507, netDebt: 102715, shares: 591.1, revenue: 126172, ebitda: 13327, pe: 5.3, evEbitda: 10.1, evRev: 1.1, revGrowth: -5.1, beta: 0.81, divYield: 8.2, range52w: [51.98, 97.92] },
  { ticker: "MBG.DE", name: "Mercedes-Benz", exchange: "FRA", sector: "Auto", subSector: "Premium OEM", ccy: "EUR", price: 37.65, prevClose: 37.62, mktCap: 35739, netDebt: 77376, shares: 949.2, revenue: 128051, ebitda: 13076, pe: 6.6, evEbitda: 8.7, evRev: 0.9, revGrowth: -3.4, beta: 0.74, divYield: 9.3, range52w: [37.3, 62.34] },
  { ticker: "GM", name: "General Motors", exchange: "NYSE", sector: "Auto", subSector: "Volume OEM", ccy: "USD", price: 80.695, prevClose: 78.71, mktCap: 68070, netDebt: 102903, shares: 843.5, revenue: 186952, ebitda: 18817, pe: 17.7, evEbitda: 9.1, evRev: 0.9, revGrowth: 0.7, beta: 1.42, divYield: 0.9, range52w: [70.25, 93.7] },
  { ticker: "STLAM.MI", name: "Stellantis", exchange: "MIL", sector: "Auto", subSector: "Volume OEM", ccy: "EUR", price: 3.1755, prevClose: 3.1305, mktCap: 9224, netDebt: 28390, shares: 2904.6, revenue: 161266, ebitda: 2589, pe: 0, evEbitda: 14.5, evRev: 0.2, revGrowth: 5.0, beta: 0.99, divYield: 0, range52w: [3.08, 10.49] },
  { ticker: "SU.PA", name: "Schneider Electric", exchange: "PAR", sector: "Industrial", subSector: "Electrification", ccy: "EUR", price: 236.6, prevClose: 226.55, mktCap: 139034, netDebt: 16291, shares: 587.6, revenue: 42042, ebitda: 8521, pe: 28.4, evEbitda: 18.2, evRev: 3.7, revGrowth: 12.9, beta: 1.2, divYield: 1.8, range52w: [221.25, 312.3] },
  { ticker: "ABBN.SW", name: "ABB", exchange: "SWX", sector: "Industrial", subSector: "Electrification", ccy: "CHF", price: 68.54, prevClose: 65.34, mktCap: 123676, netDebt: 2384, shares: 1804.4, revenue: 36962, ebitda: 7370, pe: 31.2, evEbitda: 20.2, evRev: 4.0, revGrowth: 15.1, beta: 1.05, divYield: 1.4, range52w: [55.14, 89.14] },  // Umsatz, EBITDA und Nettoschulden in USD, Börsenwert umgerechnet zum Kurs 1.1865
  { ticker: "HON", name: "Honeywell", exchange: "NSDQ", sector: "Industrial", subSector: "Diversified", ccy: "USD", price: 220.14, prevClose: 212.64, mktCap: 69863, netDebt: 11054, shares: 317.4, revenue: 37743, ebitda: 9018, pe: 10.9, evEbitda: 9.0, evRev: 2.1, revGrowth: -46.2, beta: 0.88, divYield: 1.3, range52w: [196.16, 260.28] },  // Wachstum: Folge der Abspaltungen, kein organischer Rückgang
  { ticker: "ROK", name: "Rockwell Automation", exchange: "NYSE", sector: "Industrial", subSector: "Automation", ccy: "USD", price: 386.5, prevClose: 361.93, mktCap: 42422, netDebt: 3206, shares: 109.8, revenue: 8989, ebitda: 1996, pe: 30.8, evEbitda: 22.9, evRev: 5.1, revGrowth: 6.5, beta: 1.51, divYield: 1.6, range52w: [347.53, 497.36] },
  { ticker: "RMS.PA", name: "Hermès", exchange: "PAR", sector: "Luxury", subSector: "Luxury Goods", ccy: "EUR", price: 1253.0, prevClose: 1225.5, mktCap: 131068, netDebt: -10030, shares: 104.6, revenue: 16131, ebitda: 7056, pe: 29.1, evEbitda: 17.2, evRev: 7.5, revGrowth: 3.9, beta: 1.14, divYield: 1.5, range52w: [1213.0, 2300.0] },
  { ticker: "KER.PA", name: "Kering", exchange: "PAR", sector: "Luxury", subSector: "Luxury Goods", ccy: "EUR", price: 177.92, prevClose: 172.32, mktCap: 21822, netDebt: 9427, shares: 122.6, revenue: 14456, ebitda: 2517, pe: 0, evEbitda: 12.4, evRev: 2.2, revGrowth: -1.0, beta: 1.07, divYield: 1.7, range52w: [171.7, 320.5] },
  { ticker: "CFR.SW", name: "Richemont", exchange: "SWX", sector: "Luxury", subSector: "Jewellery & Watches", ccy: "CHF", price: 175.05, prevClose: 169.0, mktCap: 102919, netDebt: -2823, shares: 534.2, revenue: 24083, ebitda: 6145, pe: 26.6, evEbitda: 17.8, evRev: 4.5, revGrowth: 12.9, beta: 1.19, divYield: 1.9, range52w: [127.2, 202.2] },  // Umsatz, EBITDA und Nettoschulden in EUR, Börsenwert umgerechnet zum Kurs 1.0883
  { ticker: "BEI.DE", name: "Beiersdorf", exchange: "FRA", sector: "Consumer", subSector: "Beauty", ccy: "EUR", price: 78.86, prevClose: 79.18, mktCap: 17233, netDebt: -2732, shares: 218.5, revenue: 9616, ebitda: 1580, pe: 18.3, evEbitda: 9.2, evRev: 1.5, revGrowth: -2.1, beta: 0.46, divYield: 1.3, range52w: [67.08, 110.15] },
  { ticker: "EL", name: "Estée Lauder", exchange: "NYSE", sector: "Consumer", subSector: "Beauty", ccy: "USD", price: 104.82, prevClose: 99.46, mktCap: 37979, netDebt: 6002, shares: 247.8, revenue: 15283, ebitda: 2600, pe: 104.8, evEbitda: 16.9, evRev: 2.9, revGrowth: 5.5, beta: 1.23, divYield: 1.4, range52w: [66.22, 121.64] },
  { ticker: "AZN", name: "AstraZeneca", exchange: "NSDQ", sector: "Pharma", subSector: "Pharma", ccy: "USD", price: 176.17, prevClose: 174.35, mktCap: 273225, netDebt: 26159, shares: 1550.9, revenue: 62384, ebitda: 21280, pe: 24.9, evEbitda: 14.1, evRev: 4.8, revGrowth: 7.9, beta: 0.15, divYield: 1.8, range52w: [153.41, 212.71] },
  { ticker: "RO.SW", name: "Roche", exchange: "SWX", sector: "Pharma", subSector: "Pharma", ccy: "CHF", price: 405.2, prevClose: 402.6, mktCap: 322850, netDebt: 23574, shares: 106.7, revenue: 62959, ebitda: 23964, pe: 26.4, evEbitda: 14.5, evRev: 5.5, revGrowth: 3.2, beta: 0.32, divYield: 2.4, range52w: [301.2, 417.8] },
  { ticker: "NVS", name: "Novartis", exchange: "NYSE", sector: "Pharma", subSector: "Pharma", ccy: "USD", price: 151.71, prevClose: 150.47, mktCap: 286523, netDebt: 39438, shares: 1888.6, revenue: 57364, ebitda: 24066, pe: 29.0, evEbitda: 13.5, evRev: 5.7, revGrowth: 1.9, beta: 0.45, divYield: 3.1, range52w: [126.5, 170.46] },
  { ticker: "SAN.PA", name: "Sanofi", exchange: "PAR", sector: "Pharma", subSector: "Pharma", ccy: "EUR", price: 85.11, prevClose: 84.92, mktCap: 102184, netDebt: 13879, shares: 1200.6, revenue: 50982, ebitda: 14773, pe: 24.6, evEbitda: 7.9, evRev: 2.3, revGrowth: 11.3, beta: 0.26, divYield: 4.8, range52w: [69.75, 89.0] },
  { ticker: "MRK", name: "Merck & Co.", exchange: "NYSE", sector: "Pharma", subSector: "Pharma", ccy: "USD", price: 135.2, prevClose: 133.72, mktCap: 333301, netDebt: 44253, shares: 2465.2, revenue: 67378, ebitda: 29492, pe: 136.6, evEbitda: 12.8, evRev: 5.6, revGrowth: 3.4, beta: 0.12, divYield: 2.6, range52w: [96.06, 156.92] },
  { ticker: "TROW", name: "T. Rowe Price", exchange: "NSDQ", sector: "AssetMgmt", subSector: "Asset Manager", ccy: "USD", price: 103.7, prevClose: 100.99, mktCap: 22122, netDebt: -2932, shares: 213.3, revenue: 7703, ebitda: 3051, pe: 10.5, evEbitda: 6.3, evRev: 2.5, revGrowth: 5.0, beta: 1.45, divYield: 5.1, range52w: [85.22, 122.0] },
  { ticker: "AMUN.PA", name: "Amundi", exchange: "PAR", sector: "AssetMgmt", subSector: "Asset Manager", ccy: "EUR", price: 93.05, prevClose: 91.85, mktCap: 18815, netDebt: -4294, shares: 202.2, revenue: 7113, ebitda: 1882, pe: 14.1, evEbitda: 7.7, evRev: 2.0, revGrowth: 7.4, beta: 1.09, divYield: 4.6, range52w: [66.45, 98.3] },
  { ticker: "DWS.DE", name: "DWS", exchange: "FRA", sector: "AssetMgmt", subSector: "Asset Manager", ccy: "EUR", price: 63.55, prevClose: 61.95, mktCap: 12710, netDebt: -3388, shares: 200.0, revenue: 4718, ebitda: 1446, pe: 12.5, evEbitda: 6.4, evRev: 2.0, revGrowth: 3.3, beta: 1.19, divYield: 4.8, range52w: [50.8, 78.75] },
  { ticker: "BX", name: "Blackstone", exchange: "NYSE", sector: "AssetMgmt", subSector: "Alternatives", ccy: "USD", price: 116.54, prevClose: 110.8, mktCap: 143854, netDebt: 12288, shares: 751.1, revenue: 15468, ebitda: 0, pe: 26.0, evEbitda: 0, evRev: 10.1, revGrowth: 13.1, beta: 1.53, divYield: 4.6, range52w: [101.73, 165.14] },
  { ticker: "CVX", name: "Chevron", exchange: "NYSE", sector: "Energy", subSector: "Integrated Oil", ccy: "USD", price: 207.505, prevClose: 208.37, mktCap: 404895, netDebt: 20730, shares: 1951.3, revenue: 226257, ebitda: 58091, pe: 15.2, evEbitda: 7.3, evRev: 1.9, revGrowth: 32.4, beta: 0.45, divYield: 3.4, range52w: [146.49, 236.48] },
  { ticker: "SHEL", name: "Shell", exchange: "NYSE", sector: "Energy", subSector: "Integrated Oil", ccy: "USD", price: 93.14, prevClose: 93.58, mktCap: 262895, netDebt: 39650, shares: 2822.6, revenue: 321295, ebitda: 67563, pe: 8.1, evEbitda: 4.5, evRev: 0.9, revGrowth: 34.8, beta: -0.25, divYield: 3.3, range52w: [68.62, 109.37] },
  { ticker: "TTE", name: "TotalEnergies", exchange: "NYSE", sector: "Energy", subSector: "Integrated Oil", ccy: "USD", price: 84.3801, prevClose: 85.2, mktCap: 184841, netDebt: 25368, shares: 2190.6, revenue: 214397, ebitda: 48615, pe: 8.4, evEbitda: 4.3, evRev: 1.0, revGrowth: 23.4, beta: 0.04, divYield: 4.6, range52w: [62.16, 95.78] },
  { ticker: "BP", name: "BP", exchange: "NYSE", sector: "Energy", subSector: "Integrated Oil", ccy: "USD", price: 42.65, prevClose: 42.75, mktCap: 109852, netDebt: 26563, shares: 2575.7, revenue: 235136, ebitda: 47098, pe: 20.8, evEbitda: 2.9, evRev: 0.6, revGrowth: 25.1, beta: -0.26, divYield: 4.9, range52w: [33.22, 51.49] },
  { ticker: "ADBE", name: "Adobe", exchange: "NSDQ", sector: "Software", subSector: "Creative / SaaS", ccy: "USD", price: 222.72, prevClose: 217.71, mktCap: 86683, netDebt: 1145, shares: 389.2, revenue: 25970, ebitda: 9917, pe: 12.4, evEbitda: 8.9, evRev: 3.4, revGrowth: 11.9, beta: 1.38, divYield: 0, range52w: [190.12, 362.71] },
  { ticker: "NOW", name: "ServiceNow", exchange: "NYSE", sector: "Software", subSector: "Workflow / SaaS", ccy: "USD", price: 92.07, prevClose: 87.61, mktCap: 95561, netDebt: 3808, shares: 1037.9, revenue: 15431, ebitda: 3235, pe: 66.2, evEbitda: 30.7, evRev: 6.4, revGrowth: 22.2, beta: 0.98, divYield: 0, range52w: [81.24, 175.0] },
  { ticker: "INTU", name: "Intuit", exchange: "NSDQ", sector: "Software", subSector: "Finance / SaaS", ccy: "USD", price: 280.05, prevClose: 270.44, mktCap: 74839, netDebt: 2390, shares: 267.2, revenue: 21917, ebitda: 7197, pe: 15.9, evEbitda: 10.7, evRev: 3.5, revGrowth: 8.2, beta: 0.92, divYield: 2.0, range52w: [252.84, 681.2] },
  { ticker: "WDAY", name: "Workday", exchange: "NSDQ", sector: "Software", subSector: "HR / SaaS", ccy: "USD", price: 176.455, prevClose: 174.52, mktCap: 42526, netDebt: 369, shares: 196.0, revenue: 10155, ebitda: 1586, pe: 35.9, evEbitda: 27.0, evRev: 4.2, revGrowth: 11.7, beta: 1.01, divYield: 0, range52w: [110.36, 236.8] },
  { ticker: "ORCL", name: "Oracle", exchange: "NYSE", sector: "Software", subSector: "Database / Cloud", ccy: "USD", price: 114.11, prevClose: 101.19, mktCap: 355762, netDebt: 132066, shares: 3117.7, revenue: 71776, ebitda: 34433, pe: 17.9, evEbitda: 14.2, evRev: 6.8, revGrowth: 34.3, beta: 1.78, divYield: 2.0, range52w: [100.25, 250.25] },
  { ticker: "TXN", name: "Texas Instruments", exchange: "NSDQ", sector: "Semis", subSector: "Analog & Power", ccy: "USD", price: 291.89, prevClose: 263.75, mktCap: 266720, netDebt: 5413, shares: 913.8, revenue: 20766, ebitda: 10713, pe: 37.9, evEbitda: 25.4, evRev: 13.1, revGrowth: 26.7, beta: 1.39, divYield: 2.3, range52w: [158.69, 334.03] },
  { ticker: "NXPI", name: "NXP", exchange: "NSDQ", sector: "Semis", subSector: "Analog & Power", ccy: "USD", price: 256.995, prevClose: 235.15, mktCap: 64776, netDebt: 7035, shares: 252.1, revenue: 13798, ebitda: 5387, pe: 20.2, evEbitda: 13.3, evRev: 5.2, revGrowth: 16.7, beta: 1.86, divYield: 1.7, range52w: [184.68, 339.95] },
  { ticker: "ON", name: "onsemi", exchange: "NSDQ", sector: "Semis", subSector: "Analog & Power", ccy: "USD", price: 66.0, prevClose: 60.84, mktCap: 25693, netDebt: 340, shares: 389.3, revenue: 6369, ebitda: 1942, pe: 38.6, evEbitda: 13.4, evRev: 4.1, revGrowth: 10.2, beta: 2.15, divYield: 0, range52w: [46.68, 134.92] },
  { ticker: "STMPA.PA", name: "STMicroelectronics", exchange: "PAR", sector: "Semis", subSector: "Analog & Power", ccy: "EUR", price: 40.11, prevClose: 36.72, mktCap: 35815, netDebt: -1885, shares: 892.9, revenue: 13669, ebitda: 3013, pe: 81.9, evEbitda: 12.3, evRev: 2.7, revGrowth: 22.9, beta: 1.54, divYield: 0.9, range52w: [18.91, 70.85] },  // Umsatz, EBITDA und Nettoschulden in USD, Börsenwert umgerechnet zum Kurs 1.0902
  { ticker: "MCHP", name: "Microchip", exchange: "NSDQ", sector: "Semis", subSector: "Analog & Power", ccy: "USD", price: 61.0, prevClose: 54.985, mktCap: 33198, netDebt: 5098, shares: 544.2, revenue: 5603, ebitda: 1866, pe: 45.9, evEbitda: 20.5, evRev: 6.8, revGrowth: 35.4, beta: 1.85, divYield: 3.3, range52w: [49.8, 105.91] },
  { ticker: "GPN", name: "Global Payments", exchange: "NYSE", sector: "FinTech", subSector: "Payments", ccy: "USD", price: 92.17, prevClose: 91.83, mktCap: 24391, netDebt: 18134, shares: 264.6, revenue: 11494, ebitda: 4948, pe: 164.6, evEbitda: 8.6, evRev: 3.7, revGrowth: 32.6, beta: 0.82, divYield: 1.1, range52w: [61.16, 102.91] },  // Wachstum: Kauf von Worldpay, Verkauf des Issuer-Geschäfts
  { ticker: "FIS", name: "FIS", exchange: "NYSE", sector: "FinTech", subSector: "Payments", ccy: "USD", price: 26.525, prevClose: 25.83, mktCap: 13673, netDebt: 20106, shares: 515.5, revenue: 12938, ebitda: 3703, pe: 4.0, evEbitda: 9.1, evRev: 2.6, revGrowth: 26.2, beta: 0.85, divYield: 6.8, range52w: [25.65, 68.37] },  // Wachstum: Kauf des Issuer-Geschäfts von Global Payments
  { ticker: "V", name: "Visa", exchange: "NYSE", sector: "FinTech", subSector: "Card Networks", ccy: "USD", price: 411.03, prevClose: 401.87, mktCap: 766900, netDebt: 8872, shares: 1724.5, revenue: 45903, ebitda: 31840, pe: 33.4, evEbitda: 24.4, evRev: 16.9, revGrowth: 11.3, beta: 0.79, divYield: 0.8, range52w: [293.89, 442.23] },
  { ticker: "MA", name: "Mastercard", exchange: "NYSE", sector: "FinTech", subSector: "Card Networks", ccy: "USD", price: 636.5675, prevClose: 625.59, mktCap: 554562, netDebt: 13474, shares: 864.7, revenue: 36288, ebitda: 23029, pe: 33.3, evEbitda: 24.7, evRev: 15.7, revGrowth: 14.0, beta: 0.77, divYield: 0.6, range52w: [464.52, 681.99] },
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
 * Ein EV/EBITDA über 100x oder ohne positives EBITDA sagt über den Wert nichts —
 * CrowdStrike stand am 23.11.2026 bei 1.900x, weil das EBITDA fast null ist.
 * Solche Peers werden gelistet, aber nicht in den Median gezogen. Banken fallen
 * aus demselben Grund heraus: Für sie gibt es kein EBITDA.
 */
export const MAX_EV_EBITDA = 100;
export const multipleAussagefaehig = (evEbitda: number) => evEbitda > 0 && evEbitda <= MAX_EV_EBITDA;

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
  // Aussagefähige Peers zuerst; die übrigen füllen nur freie Plätze und bleiben abgewählt.
  scored.sort((a, b) => Number(multipleAussagefaehig(b.evEbitda)) - Number(multipleAussagefaehig(a.evEbitda)) || b.score - a.score);
  const auswahl = scored.slice(0, n);
  const genug = auswahl.filter((p) => multipleAussagefaehig(p.evEbitda)).length >= MIN_PEERS;
  return auswahl.map((p) => ({
    included: genug && multipleAussagefaehig(p.evEbitda),
    name: p.name,
    ticker: p.ticker,
    revenueGrowth: p.revGrowth ?? 0,
    ebitdaMargin: p.ebitda > 0 ? Math.round((p.ebitda / p.revenue) * 100) : 0,
    evRevenue: p.evRev,
    evEbitda: Math.max(0, p.evEbitda),
  }));
}

export function findTicker(symbol: string | undefined): TickerInfo | undefined {
  if (!symbol) return undefined;
  return MARKET_DB.find((t) => t.ticker === symbol.toUpperCase());
}
