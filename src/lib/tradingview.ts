import type { TickerInfo } from "./marketDb";

/**
 * Übersetzt die Ticker der App in TradingView-Symbole (BÖRSE:KÜRZEL).
 *
 * US-Titel folgen aus dem Börsenfeld. Europäische Titel stehen einzeln da,
 * weil Yahoo-Suffixe und TradingView-Börsen sich nicht eins zu eins
 * entsprechen (Frankfurt → XETR, Kopenhagen → OMXCOP, NOVO-B → NOVO_B).
 */
const EINZELN: Record<string, string> = {
  // Block handelt seit Januar 2025 unter XYZ; SQ gibt es nicht mehr.
  "SQ": "NYSE:XYZ",
  "ADYEN.AS": "EURONEXT:ADYEN",
  "ASML.AS": "EURONEXT:ASML",
  "MC.PA": "EURONEXT:MC",
  "OR.PA": "EURONEXT:OR",
  "WLN.PA": "EURONEXT:WLN",
  "SAP.DE": "XETR:SAP",
  "SIE.DE": "XETR:SIE",
  "WISE.L": "LSE:WISE",
  "NEXI.MI": "MIL:NEXI",
  "NOVO-B.CO": "OMXCOP:NOVO_B",
};

const US_BOERSE: Record<string, string> = { NSDQ: "NASDAQ", NYSE: "NYSE" };

export function tvSymbol(t: Pick<TickerInfo, "ticker" | "exchange" | "priv">): string | null {
  if (t.priv) return null;
  if (EINZELN[t.ticker]) return EINZELN[t.ticker];
  const boerse = US_BOERSE[t.exchange];
  return boerse ? `${boerse}:${t.ticker}` : null;
}

/** Speicherschlüssel der gemerkten Freigabe — so auch auf /datenschutz genannt. */
export const FREIGABE_KEY = "dealdesk:tradingview";
export const FREIGABE_EVENT = "dealdesk:tradingview-freigabe";

export function freigabeGemerkt(): boolean {
  try { return localStorage.getItem(FREIGABE_KEY) === "ja"; } catch { return false; }
}

export function setzeFreigabe(merken: boolean) {
  try {
    if (merken) localStorage.setItem(FREIGABE_KEY, "ja");
    else localStorage.removeItem(FREIGABE_KEY);
  } catch { /* privates Fenster: dann gilt die Freigabe nur für diesen Chart */ }
  try { window.dispatchEvent(new Event(FREIGABE_EVENT)); } catch { /* ohne Fenster nichts zu melden */ }
}
