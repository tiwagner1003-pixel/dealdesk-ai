/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  CompanyInput, ModelInput, Peer, ForecastYear,
  Scenario, DcfOutput,
} from "./types";
import { enterpriseToSharePrice, median, pct } from "./finance";
import type { LboInputs, LboOutput } from "./lbo";

type Ctx = {
  company: CompanyInput;
  model: ModelInput;
  forecast: ForecastYear[];
  peers: Peer[];
  scenario: Scenario;
  dcf: DcfOutput;
  compsEvRevenue: number;
  compsEvEbitda: number;
  blendedEnterpriseValue: number;
  blendedEquityValue: number;
  blendedSharePrice: number;
  medianEvRevenue: number;
  medianEvEbitda: number;
  terminalShare: number;
  valuationRows: { label: string; low: number; high: number }[];
  sensitivityRows: { wacc: number; values: number[] }[];
  terminalGrowthColumns: number[];
  includedPeers: Peer[];
  /** false: keine Peers eingeschlossen, der Wert ruht allein auf dem DCF. */
  hasComps?: boolean;
  /** LBO aus dem Fall; fehlt, wenn das EBITDA nicht positiv ist. */
  lbo?: { inputs: LboInputs; out: LboOutput } | null;
};

export async function exportExcelModel(ctx: Ctx) {
  const {
    company, model, forecast, peers, scenario, dcf,
    compsEvRevenue, compsEvEbitda,
    blendedEnterpriseValue, blendedEquityValue, blendedSharePrice,
    medianEvRevenue, medianEvEbitda, terminalShare,
    valuationRows, sensitivityRows, terminalGrowthColumns, includedPeers,
  } = ctx;
  const hasComps = ctx.hasComps ?? includedPeers.length > 0;

  const XLSX = (await import("xlsx-js-style")) as any;

  function hdr(align = "center") {
    return { font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } }, fill: { patternType: "solid", fgColor: { rgb: "0B1F3A" } }, alignment: { horizontal: align, vertical: "center", wrapText: true } };
  }
  function subHdr() {
    return { font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } }, fill: { patternType: "solid", fgColor: { rgb: "2563EB" } }, alignment: { horizontal: "center", vertical: "center" } };
  }
  function lbl() {
    return { font: { bold: true, sz: 10, color: { rgb: "17212F" } }, fill: { patternType: "solid", fgColor: { rgb: "EDF2F8" } }, alignment: { horizontal: "left", vertical: "center" } };
  }
  function lblSub() {
    return { font: { sz: 10, color: { rgb: "657083" } }, fill: { patternType: "solid", fgColor: { rgb: "F8FAFB" } }, alignment: { horizontal: "left", vertical: "center" } };
  }
  function val(numFmt?: string) {
    return { font: { sz: 10, color: { rgb: "17212F" } }, alignment: { horizontal: "right", vertical: "center" }, ...(numFmt ? { numFmt } : {}) };
  }
  function valBl(numFmt?: string) {
    return { font: { bold: true, sz: 10, color: { rgb: "2563EB" } }, fill: { patternType: "solid", fgColor: { rgb: "EEF4FF" } }, alignment: { horizontal: "right", vertical: "center" }, ...(numFmt ? { numFmt } : {}) };
  }
  function valGd(numFmt?: string) {
    return { font: { bold: true, sz: 10, color: { rgb: "B7791F" } }, fill: { patternType: "solid", fgColor: { rgb: "FFF7E6" } }, alignment: { horizontal: "right", vertical: "center" }, ...(numFmt ? { numFmt } : {}) };
  }
  function ctr(align = "center", numFmt?: string) {
    return { font: { sz: 10, color: { rgb: "17212F" } }, alignment: { horizontal: align, vertical: "center" }, ...(numFmt ? { numFmt } : {}) };
  }

  function c(v: string | number, s: object): object {
    return { v, t: typeof v === "number" ? "n" : "s", s };
  }

  function buildSheet(
    rows: (object | null)[][],
    colWidths: number[],
    merges?: { s: { r: number; c: number }; e: { r: number; c: number } }[],
    freezeRow = 1,
  ): Record<string, unknown> {
    const sheet: Record<string, unknown> = {};
    let maxC = 0;
    rows.forEach((row, r) => {
      maxC = Math.max(maxC, row.length - 1);
      row.forEach((cell, col) => {
        if (cell) sheet[XLSX.utils.encode_cell({ r, c: col })] = cell;
      });
    });
    sheet["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: maxC } });
    sheet["!cols"] = colWidths.map((wch) => ({ wch }));
    if (freezeRow > 0) sheet["!freeze"] = { ySplit: freezeRow };
    if (merges) sheet["!merges"] = merges;
    return sheet;
  }

  const wb = XLSX.utils.book_new();
  const proj = dcf.projection;
  const compsAvgEv = (compsEvRevenue + compsEvEbitda) / 2;
  const medRows = includedPeers;
  const na = () => c("n/a", ctr());

  // Cover
  const coverRows: (object | null)[][] = [
    [c("DealDesk AI  ·  Investment Analysis", hdr("left")), null, null],
    [null, null, null],
    [c("COMPANY", hdr()), c("DETAIL", hdr()), null],
    [c("Name", lbl()), c(company.name, ctr("left")), null],
    [c("Ticker", lbl()), c(company.ticker, ctr("left")), null],
    [c("Sector", lbl()), c(company.sector, ctr("left")), null],
    [c("Region", lbl()), c(company.region, ctr("left")), null],
    [c("Currency", lbl()), c(company.currency, ctr("left")), null],
    [c("Scenario", lbl()), c(scenario.toUpperCase(), { font: { bold: true, sz: 10, color: { rgb: "B7791F" } }, alignment: { horizontal: "center" } }), null],
    [null, null, null],
    [c("KEY OUTPUTS", subHdr()), c(`${company.currency}m unless stated`, { font: { sz: 9, color: { rgb: "FFFFFF" } }, fill: { patternType: "solid", fgColor: { rgb: "2563EB" } }, alignment: { horizontal: "center" } }), null],
    [c(hasComps ? "Blended Enterprise Value" : "Enterprise Value (DCF only)", lbl()), c(Math.round(blendedEnterpriseValue), valBl("#,##0")), null],
    [c(hasComps ? "Blended Equity Value" : "Equity Value (DCF only)", lbl()), c(Math.round(blendedEquityValue), valBl("#,##0")), null],
    [c("Implied Share Price", lbl()), c(blendedSharePrice, valBl(`"${company.currency} "0.00`)), null],
    [c("DCF Enterprise Value", lbl()), c(Math.round(dcf.enterpriseValue), val("#,##0")), null],
    [c("Comps Enterprise Value (avg)", lbl()), hasComps ? c(Math.round(compsAvgEv), val("#,##0")) : c("n/a – no peers included", ctr()), null],
    [c("Terminal Value Share", lbl()), c(terminalShare / 100, val("0.0%")), null],
    [c("Peer Median EV / Revenue", lbl()), hasComps ? c(medianEvRevenue, val('0.0"x"')) : na(), null],
    [c("Peer Median EV / EBITDA", lbl()), hasComps ? c(medianEvEbitda, val('0.0"x"')) : na(), null],
  ];
  XLSX.utils.book_append_sheet(wb, buildSheet(coverRows, [34, 22, 4], [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 10, c: 0 }, e: { r: 10, c: 1 } },
  ], 0), "Cover");

  // Five-Year Model
  const revenueCAGR = Math.pow(proj[proj.length - 1].revenue / model.revenue, 1 / proj.length) - 1;
  const modelRows: (object | null)[][] = [
    [c("FIVE-YEAR FINANCIAL MODEL", hdr("left")), ...Array(6).fill(null) as null[]],
    [c("", hdr()), ...proj.map((p) => c(`Year ${p.year}`, hdr())), c("CAGR", hdr())],
    [c("Revenue Growth %", lblSub()), ...proj.map((p) => c(p.revenueGrowth / 100, val("0.0%"))), c("", val())],
    [c("Revenue", lbl()), ...proj.map((p) => c(Math.round(p.revenue), valBl("#,##0"))), c(revenueCAGR, valBl("0.0%"))],
    [c("EBITDA Margin %", lblSub()), ...proj.map((p) => c(p.ebitdaMargin / 100, val("0.0%"))), c("", val())],
    [c("EBITDA", lbl()), ...proj.map((p) => c(Math.round(p.ebitda), val("#,##0"))), c("", val())],
    [c("D&A", lblSub()), ...proj.map((p) => c(Math.round(p.revenue * pct(model.depreciationPercent)), val("#,##0"))), c("", val())],
    [c("EBIT", lbl()), ...proj.map((p) => c(Math.round(p.ebit), val("#,##0"))), c("", val())],
    [c("Free Cash Flow", lbl()), ...proj.map((p) => c(Math.round(p.fcf), valBl("#,##0"))), c("", valBl())],
  ];
  XLSX.utils.book_append_sheet(wb, buildSheet(modelRows, [26, 13, 13, 13, 13, 13, 10], [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }], 2), "Five-Year Model");

  // DCF
  const dcfRows: (object | null)[][] = [
    [c("DCF VALUATION BRIDGE", hdr("left")), null],
    [null, null],
    [c("WACC ASSUMPTIONS", subHdr()), null],
    [c("WACC", lbl()), c(model.wacc / 100, val("0.0%"))],
    [c("Terminal Growth Rate", lbl()), c(model.terminalGrowth / 100, val("0.0%"))],
    [c("Exit Multiple", lbl()), c(model.exitMultiple, val('0.0"x"'))],
    [c("Net Debt", lbl()), c(model.netDebt, val("#,##0"))],
    [c("Shares Outstanding (m)", lbl()), c(model.shares, val("#,##0"))],
    [null, null],
    [c("DCF OUTPUTS", subHdr()), null],
    [c("Gordon Growth EV", lbl()), c(Math.round(dcf.gordonEnterpriseValue), val("#,##0"))],
    [c("Exit Multiple EV", lbl()), c(Math.round(dcf.exitEnterpriseValue), val("#,##0"))],
    [c("Blended DCF Enterprise Value", lbl()), c(Math.round(dcf.enterpriseValue), valBl("#,##0"))],
    [c("(less) Net Debt", lblSub()), c(model.netDebt, val("#,##0"))],
    [c("Equity Value", lbl()), c(Math.round(dcf.equityValue), val("#,##0"))],
    [c("Implied Share Price", lbl()), c(dcf.sharePrice, valBl(`"${company.currency} "0.00`))],
    [c("Terminal Value / Enterprise Value", lbl()), c(terminalShare / 100, val("0.0%"))],
  ];
  XLSX.utils.book_append_sheet(wb, buildSheet(dcfRows, [34, 18], [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } },
  ], 0), "DCF");

  // Trading Comps
  const dimS = { font: { sz: 10, color: { rgb: "C0C7D0" } }, alignment: { horizontal: "right", vertical: "center" } };
  const dimC = { font: { sz: 10, color: { rgb: "C0C7D0" } }, alignment: { horizontal: "center", vertical: "center" } };
  const compHeaders = [c("Incl.", hdr()), c("Company", hdr("left")), c("Ticker", hdr()), c("Rev Growth", hdr()), c("EBITDA Margin", hdr()), c("EV / Revenue", hdr()), c("EV / EBITDA", hdr())];
  const peerDataRows = peers.map((p) => [
    c(p.included ? "✓" : "–", p.included ? ctr() : dimC),
    c(p.name, p.included ? { ...lbl(), font: { sz: 10, color: { rgb: "17212F" } } } : { font: { sz: 10, color: { rgb: "C0C7D0" } }, alignment: { horizontal: "left" } }),
    c(p.ticker, p.included ? ctr() : dimC),
    c(p.revenueGrowth / 100, p.included ? val("0.0%") : { ...dimS, numFmt: "0.0%" }),
    c(p.ebitdaMargin / 100, p.included ? val("0.0%") : { ...dimS, numFmt: "0.0%" }),
    c(p.evRevenue, p.included ? val('0.0"x"') : { ...dimS, numFmt: '0.0"x"' }),
    c(p.evEbitda, p.included ? val('0.0"x"') : { ...dimS, numFmt: '0.0"x"' }),
  ]);
  const medianDataRow = [
    c("Median", subHdr()),
    c("(included peers)", { ...subHdr(), alignment: { horizontal: "left" } }),
    c("", subHdr()),
    ...(hasComps ? [
      c(median(medRows.map((p) => p.revenueGrowth)) / 100, valBl("0.0%")),
      c(median(medRows.map((p) => p.ebitdaMargin)) / 100, valBl("0.0%")),
      c(medianEvRevenue, valBl('0.0"x"')),
      c(medianEvEbitda, valBl('0.0"x"')),
    ] : [na(), na(), na(), na()]),
  ];
  const compsRows: (object | null)[][] = [
    [c("TRADING COMPS", hdr("left")), ...Array(6).fill(null) as null[]],
    compHeaders,
    ...peerDataRows,
    medianDataRow,
  ];
  XLSX.utils.book_append_sheet(wb, buildSheet(compsRows, [8, 24, 12, 14, 14, 14, 14], [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }], 2), "Trading Comps");

  // Sensitivity
  const allSensVals = sensitivityRows.flatMap((r) => r.values);
  const minSens = Math.min(...allSensVals);
  const maxSens = Math.max(...allSensVals);
  function sensStyle(v: number) {
    const ratio = maxSens === minSens ? 0.5 : (v - minSens) / (maxSens - minSens);
    const fmt = `"${company.currency} "0.00`;
    if (ratio >= 0.67) return valBl(fmt);
    if (ratio <= 0.33) return valGd(fmt);
    return { font: { bold: true, sz: 10, color: { rgb: "17212F" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: fmt };
  }
  const sensRows: (object | null)[][] = [
    [c("WACC / TERMINAL GROWTH SENSITIVITY — IMPLIED SHARE PRICE", hdr("left")), null, null, null],
    [c("WACC  ↓  |  g  →", hdr()), ...terminalGrowthColumns.map((g) => c(`g = ${g.toFixed(1)}%`, subHdr()))],
    ...sensitivityRows.map((row) => [
      c(`${row.wacc.toFixed(1)}%`, { ...lbl(), alignment: { horizontal: "center" } }),
      ...row.values.map((v) => c(v, sensStyle(v))),
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, buildSheet(sensRows, [30, 18, 18, 18], [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }], 2), "Sensitivity");

  // Football Field
  const ffRows: (object | null)[][] = [
    [c("FOOTBALL FIELD  —  ENTERPRISE VALUE RANGE", hdr("left")), null, null, null, null],
    [c("Method", hdr("left")), c(`Low EV (${company.currency}m)`, hdr()), c(`High EV (${company.currency}m)`, hdr()), c("Low SP", hdr()), c("High SP", hdr())],
    ...valuationRows.map((row, i) => [
      c(row.label, i === 3 ? { ...lbl(), fill: { patternType: "solid", fgColor: { rgb: "EEF4FF" } } } : lbl()),
      c(Math.round(row.low), i === 3 ? valBl("#,##0") : val("#,##0")),
      c(Math.round(row.high), i === 3 ? valBl("#,##0") : val("#,##0")),
      c(enterpriseToSharePrice(row.low, model), i === 3 ? valBl(`"${company.currency} "0.00`) : val(`"${company.currency} "0.00`)),
      c(enterpriseToSharePrice(row.high, model), i === 3 ? valBl(`"${company.currency} "0.00`) : val(`"${company.currency} "0.00`)),
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, buildSheet(ffRows, [26, 18, 18, 16, 16], [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }], 2), "Football Field");

  // LBO — sponsor view
  if (ctx.lbo) {
    const { inputs: li, out: lo } = ctx.lbo;
    const m0 = "#,##0";
    const lboRows: (object | null)[][] = [
      [c(`LBO Returns  ·  ${company.currency}m`, hdr("left")), ...Array(8).fill(null)],
      [null],
      [c("ASSUMPTIONS", subHdr()), c("VALUE", subHdr())],
      [c("Entry EV / LTM EBITDA", lbl()), c(li.entryMultiple, val('0.0"x"'))],
      [c("Exit EV / EBITDA", lbl()), c(li.exitMultiple, val('0.0"x"'))],
      [c("Equity share of entry EV", lbl()), c(li.equityPct / 100, val("0%"))],
      [c("Cost of debt", lbl()), c(li.debtRate / 100, val("0.00%"))],
      [c("Hold period (years)", lbl()), c(li.holdYears, val("0"))],
      [c("Revenue growth p.a.", lbl()), c(li.revenueGrowth / 100, val("0.0%"))],
      [c("EBITDA margin expansion (pp, total)", lbl()), c(li.marginExpansion, val("0.0"))],
      [c("Entry EV", lbl()), c(Math.round(lo.entryEv), val(m0))],
      [c("Sponsor equity / Debt", lbl()), c(`${Math.round(lo.equity).toLocaleString("en-US")} / ${Math.round(lo.debt).toLocaleString("en-US")}`, ctr("right"))],
      [null],
      [c("Year", hdr()), c("Revenue", hdr()), c("EBITDA", hdr()), c("Interest", hdr()), c("Tax", hdr()),
       c("Levered FCF", hdr()), c("Debt repaid", hdr()), c("Debt EOP", hdr()), c("Cash EOP", hdr())],
      [c("Entry", lblSub()), c(Math.round(lo.entryRevenue), val(m0)), c(Math.round(lo.entryEbitda), val(m0)),
       null, null, null, null, c(Math.round(lo.debt), val(m0)), c(0, val(m0))],
      ...lo.years.map((y) => [
        c(`Y${y.year}`, lbl()), c(Math.round(y.revenue), val(m0)), c(Math.round(y.ebitda), val(m0)),
        c(Math.round(y.interest), val(m0)), c(Math.round(y.tax), val(m0)), c(Math.round(y.fcf), val(m0)),
        c(Math.round(y.repaid), val(m0)), c(Math.round(y.debt), val(m0)), c(Math.round(y.cash), val(m0)),
      ]),
      [null],
      [c("RETURNS", subHdr()), c("VALUE", subHdr())],
      [c("Exit EV", lbl()), c(Math.round(lo.exitEv), val(m0))],
      [c("Exit net debt", lbl()), c(Math.round(lo.exitNetDebt), val(m0))],
      [c("Exit equity", lbl()), c(Math.round(lo.exitEquity), valBl(m0))],
      [c("MOIC", lbl()), c(lo.moic, valBl('0.00"x"'))],
      [c("IRR", lbl()), lo.irr > -1 ? c(lo.irr, valBl("0.0%")) : c("n/m", ctr())],
      [null],
      [c("VALUE CREATION BRIDGE", subHdr()), c("", subHdr())],
      [c("Entry equity", lbl()), c(Math.round(lo.bridge.entryEquity), val(m0))],
      [c("EBITDA growth × exit multiple", lbl()), c(Math.round(lo.bridge.ebitdaGrowth), val(m0))],
      [c("Multiple expansion / contraction", lbl()), c(Math.round(lo.bridge.multipleArbitrage), val(m0))],
      [c("Deleveraging (net debt reduction)", lbl()), c(Math.round(lo.bridge.deleveraging), val(m0))],
      [c("Exit equity", lbl()), c(Math.round(lo.bridge.exitEquity), valGd(m0))],
    ];
    XLSX.utils.book_append_sheet(wb, buildSheet(lboRows, [34, 14, 14, 12, 12, 14, 14, 14, 14], [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }], 2), "LBO");
  }

  // Hidden legacy sheets (kept for re-import)
  const legacySheets = [
    {
      name: "Case Setup",
      rows: [
        ["DealDesk AI", `${company.name} valuation case`],
        ["Company", company.name],
        ["Ticker", company.ticker],
        ["Sector", company.sector],
        ["Region", company.region],
        ["Currency", company.currency],
        ["Scenario", scenario],
      ],
    },
    {
      name: "Assumptions",
      rows: [
        ["Metric", "Value"],
        ["Revenue", model.revenue],
        ["D&A / Revenue %", model.depreciationPercent],
        ["Tax Rate %", model.taxRate],
        ["Capex / Revenue %", model.capexPercent],
        ["NWC / Revenue %", model.nwcPercent],
        ["Net Debt", model.netDebt],
        ["Shares Outstanding", model.shares],
        ["WACC %", model.wacc],
        ["Terminal Growth %", model.terminalGrowth],
        ["Exit Multiple", model.exitMultiple],
      ],
    },
    {
      name: "Forecast",
      rows: [
        ["Year", "Revenue Growth %", "EBITDA Margin %"],
        ...forecast.map((row) => [`Y${row.year}`, row.revenueGrowth, row.ebitdaMargin]),
      ],
    },
    {
      name: "Peer Data",
      rows: [
        ["Included", "Company", "Ticker", "Revenue Growth %", "EBITDA Margin %", "EV/Revenue", "EV/EBITDA"],
        ...peers.map((peer) => [
          peer.included ? "Yes" : "No",
          peer.name,
          peer.ticker,
          peer.revenueGrowth,
          peer.ebitdaMargin,
          peer.evRevenue,
          peer.evEbitda,
        ]),
      ],
    },
  ];

  legacySheets.forEach((sheet) => {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows);
    worksheet["!cols"] = Array.from({ length: 8 }, () => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, worksheet, sheet.name);
  });
  const hiddenSheetNames = new Set(legacySheets.map((sheet) => sheet.name));
  wb.Workbook = wb.Workbook || {};
  wb.Workbook.Sheets = wb.SheetNames.map((name: string) => ({
    name,
    Hidden: hiddenSheetNames.has(name) ? 1 : 0,
  }));

  XLSX.writeFile(wb, `${company.ticker || "dealdesk"}-valuation-model.xlsx`);
}

export async function importExcelModel(file: File): Promise<{
  company: Partial<CompanyInput>;
  model: Partial<ModelInput>;
  forecast: ForecastYear[] | null;
  peers: Peer[] | null;
}> {
  const XLSX = await import("xlsx-js-style"); // dieselbe SheetJS-API, ohne zweites Paket
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const getRows = (n: string) =>
    wb.Sheets[n] ? (XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1 }) as (string | number)[][]) : [];
  const valueMap = (rows: (string | number)[][]) =>
    new Map(rows.slice(1).map((row) => [String(row[0] || ""), row[1]]));

  const caseRows = valueMap(getRows("Case Setup"));
  const assumptionRows = valueMap(getRows("Assumptions"));
  const forecastRows = getRows("Forecast").slice(1);
  const peerRows = getRows("Peer Data").length > 0 ? getRows("Peer Data").slice(1) : getRows("Trading Comps").slice(1);

  const company: Partial<CompanyInput> = {
    name: caseRows.get("Company") != null ? String(caseRows.get("Company")) : undefined,
    ticker: caseRows.get("Ticker") != null ? String(caseRows.get("Ticker")) : undefined,
    sector: caseRows.get("Sector") != null ? String(caseRows.get("Sector")) : undefined,
    region: caseRows.get("Region") != null ? String(caseRows.get("Region")) : undefined,
    currency: caseRows.get("Currency") != null ? String(caseRows.get("Currency")) : undefined,
  };

  const model: Partial<ModelInput> = {
    revenue: Number(assumptionRows.get("Revenue") || 0) || undefined,
    depreciationPercent: Number(assumptionRows.get("D&A / Revenue %") || 0) || undefined,
    taxRate: Number(assumptionRows.get("Tax Rate %") || 0) || undefined,
    capexPercent: Number(assumptionRows.get("Capex / Revenue %") || 0) || undefined,
    nwcPercent: Number(assumptionRows.get("NWC / Revenue %") || 0) || undefined,
    netDebt: Number(assumptionRows.get("Net Debt") || 0) || undefined,
    shares: Number(assumptionRows.get("Shares Outstanding") || 0) || undefined,
    wacc: Number(assumptionRows.get("WACC %") || 0) || undefined,
    terminalGrowth: Number(assumptionRows.get("Terminal Growth %") || 0) || undefined,
    exitMultiple: Number(assumptionRows.get("Exit Multiple") || 0) || undefined,
  };

  const forecast: ForecastYear[] | null = forecastRows.length > 0
    ? forecastRows.slice(0, 5).map((row, index) => ({
      year: index + 1,
      revenueGrowth: Number(row[1] || 0),
      ebitdaMargin: Number(row[2] || 0),
    }))
    : null;

  const peers: Peer[] | null = peerRows.length > 0
    ? peerRows.map((row) => ({
      included: String(row[0] || "Yes").toLowerCase() !== "no",
      name: String(row[1] || "Peer"),
      ticker: String(row[2] || "TICK"),
      revenueGrowth: Number(row[3] || 0),
      ebitdaMargin: Number(row[4] || 0),
      evRevenue: Number(row[5] || 0),
      evEbitda: Number(row[6] || 0),
    }))
    : null;

  return { company, model, forecast, peers };
}
