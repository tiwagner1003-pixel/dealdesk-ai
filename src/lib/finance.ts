import type {
  CompanyInput, ModelInput, Peer, ForecastYear,
  Scenario, ProjectionYear, DcfOutput,
} from "./types";

export const pct = (v: number) => v / 100;

export function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Comps zählen nur mit eingeschlossenen Peers. Bis zum 23.11.2026 griff die
 * Rechnung auf alle Peers zurück, wenn keiner eingeschlossen war — wer jeden
 * Haken entfernte, bekam trotzdem einen Median. Ohne Peers trägt der DCF allein.
 */
export function compsOf(peers: Peer[], revenue: number, ebitda: number) {
  const incl = peers.filter((p) => p.included);
  const rev = incl.map((p) => p.evRevenue);
  const eb = incl.map((p) => p.evEbitda);
  const medRev = median(rev);
  const medEbitda = median(eb);
  const has = incl.length > 0;
  const evRev = revenue * medRev;
  const evEbitda = ebitda * medEbitda;
  return {
    peers: incl, has, medRev, medEbitda,
    revLow: percentile(rev, 0.25), revHigh: percentile(rev, 0.75),
    ebitdaLow: percentile(eb, 0.25), ebitdaHigh: percentile(eb, 0.75),
    evRev, evEbitda, avg: has ? (evRev + evEbitda) / 2 : 0,
  };
}

/** Mittel aus DCF und den beiden Multiplikatoren — oder der DCF, wenn Comps fehlen. */
export function blendEv(dcfEv: number, c: ReturnType<typeof compsOf>) {
  return c.has ? (dcfEv + c.evRev + c.evEbitda) / 3 : dcfEv;
}

export function scenarioAdjustment(scenario: Scenario) {
  if (scenario === "upside") return { growth: 3, margin: 2 };
  if (scenario === "downside") return { growth: -4, margin: -3 };
  return { growth: 0, margin: 0 };
}

export function calculateProjection(
  model: ModelInput,
  forecast: ForecastYear[],
  scenario: Scenario,
): ProjectionYear[] {
  const adj = scenarioAdjustment(scenario);
  let revenue = model.revenue;
  return forecast.map((row) => {
    const growth = row.revenueGrowth + adj.growth;
    const margin = row.ebitdaMargin + adj.margin;
    revenue *= 1 + pct(growth);
    const ebitda = revenue * pct(margin);
    const dep = revenue * pct(model.depreciationPercent);
    const ebit = ebitda - dep;
    const tax = Math.max(0, ebit * pct(model.taxRate));
    const capex = revenue * pct(model.capexPercent);
    const nwc = revenue * pct(model.nwcPercent);
    return {
      year: row.year,
      revenueGrowth: growth,
      ebitdaMargin: margin,
      revenue,
      ebitda,
      ebit,
      fcf: ebit - tax + dep - capex - nwc,
    };
  });
}

export function calculateDcf(
  model: ModelInput,
  forecast: ForecastYear[],
  scenario: Scenario,
): DcfOutput {
  const projection = calculateProjection(model, forecast, scenario);
  const discountRate = pct(model.wacc);
  const terminalGrowth = pct(model.terminalGrowth);
  const pvFcfs = projection.map((row) => row.fcf / Math.pow(1 + discountRate, row.year));
  const last = projection[projection.length - 1];
  const gordonTv = (last.fcf * (1 + terminalGrowth)) / Math.max(discountRate - terminalGrowth, 0.01);
  const exitTv = last.ebitda * model.exitMultiple;
  const pvGordon = gordonTv / Math.pow(1 + discountRate, projection.length);
  const pvExit = exitTv / Math.pow(1 + discountRate, projection.length);
  const pvForecast = pvFcfs.reduce((a, b) => a + b, 0);
  const gordonEv = pvForecast + pvGordon;
  const exitEv = pvForecast + pvExit;
  const enterpriseValue = (gordonEv + exitEv) / 2;
  const equityValue = enterpriseValue - model.netDebt;
  const sharePrice = model.shares > 0 ? equityValue / model.shares : 0;
  const pvTerminal = (pvGordon + pvExit) / 2;
  return {
    projection,
    enterpriseValue,
    gordonEnterpriseValue: gordonEv,
    exitEnterpriseValue: exitEv,
    equityValue,
    sharePrice,
    pvTerminal,
    terminalShare: enterpriseValue > 0 ? (pvTerminal / enterpriseValue) * 100 : 0,
  };
}

export function enterpriseToSharePrice(enterpriseValue: number, model: ModelInput) {
  return model.shares > 0 ? (enterpriseValue - model.netDebt) / model.shares : 0;
}

/* ── Initial seed data ─────────────────────────────────────── */

export const INITIAL_COMPANY: CompanyInput = {
  name: "Adyen",
  ticker: "ADYEN.AS",
  exchange: "AMS",
  sector: "Payments / FinTech",
  region: "Europe",
  currency: "EUR",
};

export const INITIAL_MODEL: ModelInput = {
  revenue: 1850,
  depreciationPercent: 4,
  taxRate: 25,
  capexPercent: 5,
  nwcPercent: 2,
  netDebt: -2300,
  shares: 31,
  wacc: 9,
  terminalGrowth: 3,
  exitMultiple: 16,
};

export const INITIAL_FORECAST: ForecastYear[] = [
  { year: 1, revenueGrowth: 15, ebitdaMargin: 45 },
  { year: 2, revenueGrowth: 14, ebitdaMargin: 46 },
  { year: 3, revenueGrowth: 12, ebitdaMargin: 47 },
  { year: 4, revenueGrowth: 10, ebitdaMargin: 48 },
  { year: 5, revenueGrowth: 8,  ebitdaMargin: 49 },
];

export const INITIAL_PEERS: Peer[] = [
  { included: true,  name: "PayPal",    ticker: "PYPL",    revenueGrowth: 7,  ebitdaMargin: 24, evRevenue: 2.4, evEbitda: 9.8 },
  { included: true,  name: "Block",     ticker: "XYZ",     revenueGrowth: 11, ebitdaMargin: 18, evRevenue: 1.8, evEbitda: 12.6 },
  { included: true,  name: "Wise",      ticker: "WISE.L",  revenueGrowth: 18, ebitdaMargin: 32, evRevenue: 6.2, evEbitda: 19.4 },
  { included: true,  name: "Nexi",      ticker: "NEXI.MI", revenueGrowth: 5,  ebitdaMargin: 50, evRevenue: 3.1, evEbitda: 8.7 },
  { included: false, name: "Worldline", ticker: "WLN.PA",  revenueGrowth: 4,  ebitdaMargin: 27, evRevenue: 1.4, evEbitda: 5.9 },
];
