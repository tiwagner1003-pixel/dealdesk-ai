/* ────────────────────────────────────────────────────────────────
   LBO returns model — sponsor view, leveraged buyout

   Bis zum 23.11.2026 rechnete das Modul einen fest verdrahteten Deal
   (48 Mrd. EV, Umsatz = EV / 7,5) für jeden Fall gleich. Jetzt kommen
   Umsatz, EBITDA und die Kostenquoten aus dem Fall; der Fonds wählt nur
   Einstieg, Ausstieg, Finanzierung und Haltedauer.
   ──────────────────────────────────────────────────────────────── */

/** Was der Fonds entscheidet — wird je Fall gespeichert. */
export type LboAssumptions = {
  entryMultiple: number;    // EV/EBITDA at entry
  exitMultiple: number;     // EV/EBITDA at exit
  equityPct: number;        // % equity in the entry capital structure
  debtRate: number;         // % all-in cost of debt
  holdYears: number;        // 3..8
  revenueGrowth: number;    // % per annum over the hold
  marginExpansion: number;  // total pp over the hold
};

/** Was aus dem Fall kommt — das operative Geschäft, das gekauft wird. */
export type LboOperating = {
  entryRevenue: number;     // LTM revenue, millions
  entryEbitda: number;      // LTM EBITDA, millions
  daPct: number;            // D&A in % of revenue
  capexPct: number;         // capex in % of revenue
  nwcPct: number;           // NWC investment in % of revenue
  taxRate: number;          // %
};

export type LboInputs = LboAssumptions & LboOperating;

export type LboYearRow = {
  year: number;
  revenue: number;
  margin: number;
  ebitda: number;
  interest: number;
  tax: number;
  /** Levered free cash flow: after interest, tax, capex and NWC. */
  fcf: number;
  /** Debt repaid out of free cash flow (negative = revolver draw). */
  repaid: number;
  debt: number;
  cash: number;
};

export type LboOutput = {
  entryEv: number;
  entryRevenue: number;
  entryEbitda: number;
  equity: number;
  debt: number;
  years: LboYearRow[];
  exitEbitda: number;
  exitEv: number;
  exitDebt: number;
  exitCash: number;
  exitNetDebt: number;
  exitEquity: number;
  moic: number;
  irr: number;
  bridge: {
    entryEquity: number;
    ebitdaGrowth: number;
    multipleArbitrage: number;
    deleveraging: number;
    exitEquity: number;
  };
};

/**
 * Cash sweep: Der freie Cashflow tilgt zuerst die Schulden; sind sie getilgt,
 * sammelt er sich als Kasse. Ein negatives Jahr greift erst auf die Kasse,
 * dann auf neue Schulden zu. Eine Einzahlung, eine Auszahlung — deshalb gilt
 * IRR = MOIC^(1/n) − 1 exakt.
 */
export function calculateLbo(input: LboInputs): LboOutput {
  const { entryRevenue, entryEbitda } = input;
  const entryEv = entryEbitda * input.entryMultiple;
  const equity = entryEv * (input.equityPct / 100);
  const debt = entryEv - equity;
  const hold = Math.max(1, Math.round(input.holdYears));

  let rev = entryRevenue;
  let margin = entryRevenue > 0 ? (entryEbitda / entryRevenue) * 100 : 0;
  let debtBal = debt;
  let cash = 0;
  const years: LboYearRow[] = [];

  for (let y = 1; y <= hold; y++) {
    rev *= 1 + input.revenueGrowth / 100;
    margin += input.marginExpansion / hold;
    const ebitda = rev * (margin / 100);
    const da = rev * (input.daPct / 100);
    const interest = debtBal * (input.debtRate / 100);
    const tax = Math.max(0, (ebitda - da - interest) * (input.taxRate / 100));
    const capex = rev * (input.capexPct / 100);
    const nwc = rev * (input.nwcPct / 100);
    const fcf = ebitda - interest - tax - capex - nwc;

    let repaid: number;
    if (fcf >= 0) {
      repaid = Math.min(fcf, debtBal);
      debtBal -= repaid;
      cash += fcf - repaid;
    } else {
      const fromCash = Math.min(cash, -fcf);
      cash -= fromCash;
      const draw = -fcf - fromCash;
      debtBal += draw;
      repaid = -draw;
    }
    years.push({ year: y, revenue: rev, margin, ebitda, interest, tax, fcf, repaid, debt: debtBal, cash });
  }

  const last = years[years.length - 1];
  const exitEbitda = last.ebitda;
  const exitEv = exitEbitda * input.exitMultiple;
  const exitNetDebt = last.debt - last.cash;
  const exitEquity = exitEv - exitNetDebt;
  const moic = equity > 0 ? exitEquity / equity : 0;
  const irr = moic > 0 ? Math.pow(moic, 1 / hold) - 1 : -1;

  return {
    entryEv, entryRevenue, entryEbitda, equity, debt, years,
    exitEbitda, exitEv, exitDebt: last.debt, exitCash: last.cash, exitNetDebt, exitEquity, moic, irr,
    bridge: {
      entryEquity: equity,
      ebitdaGrowth: (exitEbitda - entryEbitda) * input.exitMultiple,
      multipleArbitrage: entryEbitda * (input.exitMultiple - input.entryMultiple),
      deleveraging: debt - exitNetDebt,
      exitEquity,
    },
  };
}

/** 5×5 IRR grid around base revenue growth × exit multiple. */
export function lboSensitivity(input: LboInputs) {
  const sensExitM = [-2, -1, 0, 1, 2].map((d) => input.exitMultiple + d);
  const sensGrowth = [-4, -2, 0, 2, 4].map((d) => input.revenueGrowth + d);
  const grid = sensGrowth.map((g) =>
    sensExitM.map((em) => calculateLbo({ ...input, revenueGrowth: g, exitMultiple: em }).irr)
  );
  return { sensExitM, sensGrowth, grid };
}

const halb = (v: number) => Math.round(v * 2) / 2;

/**
 * Fremdkapital wird in der Praxis am EBITDA bemessen, nicht am Kaufpreis:
 * Banken finanzieren rund 5–6x. Ein fester Eigenkapitalanteil ergäbe bei einem
 * teuren Ziel eine Hebelung, die niemand finanziert (40 % EK bei 17x = 10x).
 */
export const DEFAULT_LEVERAGE = 5.5;

/**
 * Startwerte aus dem Fall. Einstieg: bei börsennotierten Zielen zum aktuellen
 * EV/EBITDA des Markts — ein Fonds kauft nicht unter dem Kurs —, sonst zum
 * Median der Vergleichsgruppe, ohne beides zu 10x. Ausstieg zum selben
 * Vielfachen: keine Multiple-Expansion als Grundannahme. Wachstum und
 * Margenausweitung aus der eigenen Planung, Fremdkapital zu DEFAULT_LEVERAGE.
 */
export function defaultLboAssumptions(args: {
  marketEvEbitda?: number | null;
  peerEvEbitda: number | null;
  forecast: { revenueGrowth: number; ebitdaMargin: number }[];
}): LboAssumptions & { entrySource: "market" | "peers" | "default" } {
  const ok = (v: number | null | undefined): v is number => v != null && v > 0 && v < 100;
  const entrySource = ok(args.marketEvEbitda) ? "market" : ok(args.peerEvEbitda) ? "peers" : "default";
  const raw = entrySource === "market" ? args.marketEvEbitda! : entrySource === "peers" ? args.peerEvEbitda! : 10;
  const m = halb(Math.min(Math.max(raw, 4), 28));
  const f = args.forecast;
  const growth = f.length ? f.reduce((a, r) => a + r.revenueGrowth, 0) / f.length : 5;
  const expansion = f.length > 1 ? f[f.length - 1].ebitdaMargin - f[0].ebitdaMargin : 0;
  const debtShare = Math.min(DEFAULT_LEVERAGE / m, 0.8);
  return {
    entryMultiple: m,
    exitMultiple: m,
    equityPct: Math.min(Math.max(Math.round((1 - debtShare) * 100), 20), 70),
    debtRate: 8,
    holdYears: 5,
    revenueGrowth: halb(Math.min(Math.max(growth, -5), 30)),
    marginExpansion: halb(Math.min(Math.max(expansion, -5), 10)),
    entrySource,
  };
}
