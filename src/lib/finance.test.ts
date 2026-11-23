/**
 * Einheitentests für den Bewertungskern — laufen mit `npm test` (node --test,
 * ohne Testrahmen; Node streift die Typen selbst ab). Die Erwartungswerte sind
 * von Hand nachgerechnet, nicht aus dem Code abgeschrieben.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  median, percentile, compsOf, blendEv, calculateProjection, calculateDcf,
  enterpriseToSharePrice,
} from "./finance.ts";
import type { ModelInput, ForecastYear, Peer } from "./types.ts";

const close = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `expected ${b}, got ${a}`);

const model: ModelInput = {
  revenue: 100, depreciationPercent: 5, taxRate: 25, capexPercent: 5, nwcPercent: 2,
  netDebt: 20, shares: 10, wacc: 10, terminalGrowth: 2, exitMultiple: 10,
};
const forecast: ForecastYear[] = [
  { year: 1, revenueGrowth: 10, ebitdaMargin: 20 },
  { year: 2, revenueGrowth: 10, ebitdaMargin: 20 },
];

test("median and percentile", () => {
  assert.equal(median([]), 0);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  close(percentile([1, 2, 3, 4, 5], 0.25), 2);
  close(percentile([10, 20], 0.75), 17.5);
});

test("projection: revenue compounds, FCF = EBIT − tax + D&A − capex − ΔNWC", () => {
  const [y1, y2] = calculateProjection(model, forecast, "base");
  close(y1.revenue, 110);
  close(y1.ebitda, 22);
  close(y1.ebit, 16.5);
  close(y1.fcf, 16.5 - 4.125 + 5.5 - 5.5 - 2.2); // 10.175
  close(y2.revenue, 121);
  close(y2.fcf, 11.1925);
});

test("scenarios shift growth and margin, not the inputs", () => {
  const up = calculateProjection(model, forecast, "upside")[0];
  const down = calculateProjection(model, forecast, "downside")[0];
  assert.equal(up.revenueGrowth, 13);
  assert.equal(up.ebitdaMargin, 22);
  assert.equal(down.revenueGrowth, 6);
  assert.equal(down.ebitdaMargin, 17);
  assert.equal(forecast[0].revenueGrowth, 10);
});

test("DCF: EV = PV(FCF) + average of Gordon and exit-multiple terminal values", () => {
  const dcf = calculateDcf(model, forecast, "base");
  // PV(FCF) = 10.175/1.1 + 11.1925/1.21 = 9.25 + 9.25
  const pvForecast = 18.5;
  const pvGordon = (11.1925 * 1.02) / 0.08 / 1.21; // 117.9375
  const pvExit = (24.2 * 10) / 1.21;               // 200
  close(dcf.gordonEnterpriseValue, pvForecast + pvGordon);
  close(dcf.exitEnterpriseValue, pvForecast + pvExit);
  close(dcf.enterpriseValue, 177.46875);
  close(dcf.equityValue, 157.46875);
  close(dcf.sharePrice, 15.746875);
  close(dcf.terminalShare, ((pvGordon + pvExit) / 2 / 177.46875) * 100);
  close(enterpriseToSharePrice(dcf.enterpriseValue, model), dcf.sharePrice);
});

test("DCF: higher WACC lowers value", () => {
  const lo = calculateDcf({ ...model, wacc: 9 }, forecast, "base").enterpriseValue;
  const hi = calculateDcf({ ...model, wacc: 11 }, forecast, "base").enterpriseValue;
  assert.ok(lo > hi);
});

const peer = (name: string, evRevenue: number, evEbitda: number, included = true): Peer =>
  ({ included, name, ticker: name, revenueGrowth: 5, ebitdaMargin: 20, evRevenue, evEbitda });

test("comps use only included peers", () => {
  const c = compsOf([peer("A", 2, 10), peer("B", 4, 14), peer("X", 50, 90, false)], 100, 20);
  assert.equal(c.has, true);
  assert.equal(c.peers.length, 2);
  close(c.medRev, 3);
  close(c.medEbitda, 12);
  close(c.evRev, 300);
  close(c.evEbitda, 240);
  close(c.avg, 270);
  close(blendEv(180, c), (180 + 300 + 240) / 3);
});

test("without included peers the DCF carries the value alone", () => {
  const c = compsOf([peer("A", 2, 10, false)], 100, 20);
  assert.equal(c.has, false);
  assert.equal(c.avg, 0);
  assert.equal(blendEv(180, c), 180);
});
