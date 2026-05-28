/* ────────────────────────────────────────────────────────────────
   LBO returns model — sponsor view, leveraged buyout
   ──────────────────────────────────────────────────────────────── */

export type LboInputs = {
  entryEv: number;          // EV at entry, in millions
  entryMultiple: number;    // EV/EBITDA at entry
  exitMultiple: number;     // EV/EBITDA at exit
  equityPct: number;        // % equity in cap structure
  revenueGrowth: number;    // % per annum
  marginExpansion: number;  // total pp over hold
  holdYears: number;        // 3..8
  debtRate: number;         // % all-in cost of debt
  capexPct?: number;        // % of revenue
  nwcPct?: number;          // % of revenue
  taxRate?: number;
};

export type LboYearRow = {
  year: number;
  revenue: number;
  margin: number;
  ebitda: number;
  interest: number;
  fcf: number;
  sweep: number;
  debt: number;
};

export type LboOutput = {
  entryRevenue: number;
  entryEbitda: number;
  equity: number;
  debt: number;
  years: LboYearRow[];
  exitEbitda: number;
  exitEv: number;
  exitDebt: number;
  exitEquity: number;
  moic: number;
  irr: number;
  bridge: {
    entryEquity: number;
    ebitdaGrowth: number;
    multipleArbitrage: number;
    debtPaydown: number;
    exitEquity: number;
  };
};

export function calculateLbo(input: LboInputs): LboOutput {
  const capexPct = input.capexPct ?? 4;
  const nwcPct = input.nwcPct ?? 3;
  const taxRate = input.taxRate ?? 25;

  const entryEbitda = input.entryEv / input.entryMultiple;
  const entryRevenue = input.entryEv / 7.5;
  const equity = input.entryEv * (input.equityPct / 100);
  const debt = input.entryEv - equity;

  let rev = entryRevenue;
  let margin = (entryEbitda / entryRevenue) * 100;
  let debtBal = debt;
  const years: LboYearRow[] = [];

  for (let y = 1; y <= input.holdYears; y++) {
    rev *= 1 + input.revenueGrowth / 100;
    margin += input.marginExpansion / input.holdYears;
    const ebitda = rev * (margin / 100);
    const interest = debtBal * (input.debtRate / 100);
    const tax = Math.max(0, (ebitda - rev * (capexPct / 100) - interest) * (taxRate / 100));
    const fcf = ebitda - rev * (capexPct / 100) - rev * (nwcPct / 100) - interest - tax;
    const sweep = Math.max(fcf * 0.8, 0);
    debtBal = Math.max(debtBal - sweep, 0);
    years.push({ year: y, revenue: rev, margin, ebitda, interest, fcf, sweep, debt: debtBal });
  }

  const exitEbitda = years[years.length - 1].ebitda;
  const exitEv = exitEbitda * input.exitMultiple;
  const exitDebt = years[years.length - 1].debt;
  const exitEquity = exitEv - exitDebt;
  const moic = exitEquity / equity;
  const irr = Math.pow(moic, 1 / input.holdYears) - 1;

  return {
    entryRevenue, entryEbitda, equity, debt, years,
    exitEbitda, exitEv, exitDebt, exitEquity, moic, irr,
    bridge: {
      entryEquity: equity,
      ebitdaGrowth: (exitEbitda - entryEbitda) * input.exitMultiple,
      multipleArbitrage: entryEbitda * (input.exitMultiple - input.entryMultiple),
      debtPaydown: debt - exitDebt,
      exitEquity,
    },
  };
}

/**
 * Build a 5×5 IRR sensitivity grid around base growth × exit multiple.
 */
export function lboSensitivity(input: LboInputs) {
  const sensExitM = [input.exitMultiple - 2, input.exitMultiple - 1, input.exitMultiple, input.exitMultiple + 1, input.exitMultiple + 2];
  const sensGrowth = [input.revenueGrowth - 4, input.revenueGrowth - 2, input.revenueGrowth, input.revenueGrowth + 2, input.revenueGrowth + 4];
  const grid = sensGrowth.map((g) =>
    sensExitM.map((em) => calculateLbo({ ...input, revenueGrowth: g, exitMultiple: em }).irr)
  );
  return { sensExitM, sensGrowth, grid };
}
