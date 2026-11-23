/** Einheitentests für das LBO — Erwartungswerte von Hand gerechnet. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateLbo, lboSensitivity, defaultLboAssumptions, type LboInputs } from "./lbo.ts";

const close = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `expected ${b}, got ${a}`);

// Flat business, no tax/capex/NWC: FCF = EBITDA − interest, all of it repays debt.
const flat: LboInputs = {
  entryRevenue: 1000, entryEbitda: 200, daPct: 0, capexPct: 0, nwcPct: 0, taxRate: 0,
  entryMultiple: 10, exitMultiple: 10, equityPct: 40, debtRate: 5,
  holdYears: 3, revenueGrowth: 0, marginExpansion: 0,
};

test("entry: EV = EBITDA × multiple, split into equity and debt", () => {
  const o = calculateLbo(flat);
  close(o.entryEv, 2000);
  close(o.equity, 800);
  close(o.debt, 1200);
});

test("cash sweep pays down debt year by year", () => {
  const o = calculateLbo(flat);
  // Y1: 200 − 60 = 140 → 1060; Y2: 200 − 53 = 147 → 913; Y3: 200 − 45.65 → 758.65
  close(o.years[0].debt, 1060);
  close(o.years[1].debt, 913);
  close(o.years[2].debt, 758.65);
  close(o.exitEquity, 2000 - 758.65);
  close(o.moic, 1241.35 / 800);
  close(o.irr, Math.pow(1241.35 / 800, 1 / 3) - 1);
});

test("value-creation bridge adds up to exit equity", () => {
  for (const inp of [
    flat,
    { ...flat, revenueGrowth: 8, marginExpansion: 3, exitMultiple: 11.5, taxRate: 25, capexPct: 4, nwcPct: 2, daPct: 3, holdYears: 5 },
    { ...flat, exitMultiple: 7, revenueGrowth: -3 },
  ]) {
    const o = calculateLbo(inp);
    const b = o.bridge;
    close(b.entryEquity + b.ebitdaGrowth + b.multipleArbitrage + b.deleveraging, b.exitEquity, 1e-6);
  }
});

test("once the debt is repaid, free cash flow builds up as cash", () => {
  const o = calculateLbo({ ...flat, equityPct: 95 }); // debt 100
  assert.equal(o.years[0].debt, 0);
  assert.ok(o.years[0].cash > 0);
  assert.ok(o.exitNetDebt < 0);
  close(o.exitEquity, o.exitEv - o.exitDebt + o.exitCash);
});

test("negative free cash flow draws new debt", () => {
  const o = calculateLbo({ ...flat, entryEbitda: 10, capexPct: 5 });
  assert.ok(o.years[0].fcf < 0);
  assert.ok(o.years[0].repaid < 0);
  assert.ok(o.years[0].debt > o.debt);
});

test("wiped-out equity reports IRR −100 %, not NaN", () => {
  const o = calculateLbo({ ...flat, exitMultiple: 2, equityPct: 20 });
  assert.ok(o.exitEquity <= 0);
  assert.equal(o.irr, -1);
});

test("sensitivity grid is centred on the base case", () => {
  const s = lboSensitivity(flat);
  assert.deepEqual(s.sensExitM, [8, 9, 10, 11, 12]);
  close(s.grid[2][2], calculateLbo(flat).irr);
  assert.ok(s.grid[2][4] > s.grid[2][0]);
});

test("defaults come from the case: peer multiple, average growth, margin path", () => {
  const d = defaultLboAssumptions({
    peerEvEbitda: 12.3,
    forecast: [
      { revenueGrowth: 10, ebitdaMargin: 20 }, { revenueGrowth: 8, ebitdaMargin: 21 },
      { revenueGrowth: 6, ebitdaMargin: 23 },
    ],
  });
  assert.equal(d.entryMultiple, 12.5);
  assert.equal(d.exitMultiple, 12.5);
  assert.equal(d.revenueGrowth, 8);
  assert.equal(d.marginExpansion, 3);
  assert.equal(d.entrySource, "peers");
  // Debt sized at 5.5x EBITDA: 5.5 / 12.5 = 44 % of EV → 56 % equity.
  assert.equal(d.equityPct, 56);
  const none = defaultLboAssumptions({ peerEvEbitda: null, forecast: [] });
  assert.equal(none.entryMultiple, 10);
  assert.equal(none.entrySource, "default");
});

test("a listed target is bought at its market multiple, not below it", () => {
  const d = defaultLboAssumptions({ marketEvEbitda: 17.2, peerEvEbitda: 8.6, forecast: [] });
  assert.equal(d.entryMultiple, 17);
  assert.equal(d.entrySource, "market");
  // 5.5x leverage on a 17x entry: debt is 32 % of EV, equity 68 %.
  assert.equal(d.equityPct, 68);
  // Meaningless market multiples (negative EBITDA, >100x) fall back to the peers.
  assert.equal(defaultLboAssumptions({ marketEvEbitda: 1900, peerEvEbitda: 8.6, forecast: [] }).entrySource, "peers");
});
