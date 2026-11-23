/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  CompanyInput, ModelInput, Peer, ForecastYear,
  Scenario, DcfOutput, AiMemo,
} from "./types";
import { enterpriseToSharePrice, median } from "./finance";
import { formatMoney, formatMultiple } from "./format";

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
  valuationScaleMax: number;
  sensitivityRows: { wacc: number; values: number[] }[];
  terminalGrowthColumns: number[];
  includedPeers: Peer[];
  aiMemo: AiMemo | null;
  /** false: keine Peers eingeschlossen, der Wert ruht allein auf dem DCF. */
  hasComps?: boolean;
};

export async function exportPowerPointDeck(ctx: Ctx) {
  const {
    company, model, forecast, peers, scenario, dcf,
    compsEvRevenue, compsEvEbitda,
    blendedEnterpriseValue, blendedEquityValue, blendedSharePrice,
    medianEvRevenue, medianEvEbitda, terminalShare,
    valuationRows, valuationScaleMax, sensitivityRows, terminalGrowthColumns,
    includedPeers, aiMemo,
  } = ctx;
  const hasComps = ctx.hasComps ?? includedPeers.length > 0;
  const blendLabel = hasComps ? "Blended" : "DCF-only";
  const peerMult = (v: number) => hasComps ? formatMultiple(v) : "n/a";

  const pptxgen = (await import("pptxgenjs")).default;
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "DealDesk AI";
  pptx.subject = `${company.name} valuation case`;
  pptx.title = `${company.name} Investment Memo`;
  pptx.company = "DealDesk AI";
  pptx.theme = { headFontFace: "Aptos Display", bodyFontFace: "Aptos" };

  const C = {
    navy: "0B1F3A", navyMid: "132B4A",
    blue: "2563EB", blueSoft: "EEF4FF",
    gold: "B7791F", goldSoft: "FFF7E6",
    slate: "17212F", muted: "657083",
    white: "FFFFFF", panel: "F4F7FB", line: "D7DEE8",
    dim: "C0C7D0",
  };

  function frame(slide: any, page: number) {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.09, h: 7.5, fill: { color: C.blue }, line: { color: C.blue } });
    slide.addShape(pptx.ShapeType.rect, { x: 0.22, y: 6.96, w: 13.0, h: 0.02, fill: { color: C.line }, line: { color: C.line } });
    slide.addText(`${company.name}  ·  ${company.ticker}  ·  ${scenario.toUpperCase()} CASE`, { x: 0.28, y: 7.06, w: 9, h: 0.2, fontSize: 7.5, color: C.muted });
    slide.addText(`DealDesk AI  ·  ${page}`, { x: 9.28, y: 7.06, w: 3.9, h: 0.2, fontSize: 7.5, color: C.muted, align: "right" });
  }
  function eyebrow(slide: any, text: string) {
    slide.addText(text, { x: 0.28, y: 0.2, w: 10, h: 0.22, fontSize: 8, bold: true, color: C.blue });
  }
  function heading(slide: any, text: string) {
    slide.addText(text, { x: 0.28, y: 0.45, w: 12.7, h: 0.46, fontSize: 22, bold: true, color: C.navy });
  }
  function kpiBox(slide: any, x: number, y: number, w: number, h: number, label: string, value: string, highlighted = false) {
    slide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: highlighted ? C.blue : C.panel }, line: { color: highlighted ? C.blue : C.line } });
    slide.addText(value, { x: x + 0.14, y: y + 0.1, w: w - 0.28, h: h * 0.52, fontSize: 16, bold: true, color: highlighted ? C.white : C.slate, valign: "middle" });
    slide.addText(label, { x: x + 0.14, y: y + h * 0.55, w: w - 0.28, h: h * 0.38, fontSize: 8.5, bold: true, color: highlighted ? "C5D1DF" : C.muted, valign: "top" });
  }
  function pjCell(text: string, opts: Record<string, any> = {}) { return { text, options: opts }; }
  const hCell = (t: string) => pjCell(t, { bold: true, color: C.white, fill: { color: C.navy }, align: "center" });
  const blCell = (t: string, lft = false) => pjCell(t, { bold: true, color: C.white, fill: { color: C.blue }, align: lft ? "left" : "center" });
  const blSoftCell = (t: string, lft = false) => pjCell(t, { bold: true, color: C.navy, fill: { color: C.blueSoft }, align: lft ? "left" : "center" });
  const panelCell = (t: string, lft = false) => pjCell(t, { bold: true, color: C.slate, fill: { color: C.panel }, align: lft ? "left" : "center" });
  const mutedCell = (t: string) => pjCell(t, { color: C.muted, align: "center" });
  const numCell = (t: string) => pjCell(t, { color: C.slate, align: "center" });

  const proj = dcf.projection;
  const compsAvgEv = (compsEvRevenue + compsEvEbitda) / 2;
  const medRows = includedPeers;

  /* Slide 1: Title */
  const s1 = pptx.addSlide();
  s1.background = { color: C.navy };
  s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: C.blue }, line: { color: C.blue } });
  s1.addText("DealDesk AI", { x: 0.46, y: 0.36, w: 3.5, h: 0.32, fontSize: 14, bold: true, color: C.white });
  s1.addShape(pptx.ShapeType.rect, { x: 0.46, y: 0.75, w: 0.38, h: 0.04, fill: { color: C.blue }, line: { color: C.blue } });
  s1.addText(company.name, { x: 0.46, y: 1.35, w: 9.1, h: 0.72, fontSize: 40, bold: true, color: C.white });
  s1.addText("Valuation Case  ·  Investment Memo", { x: 0.48, y: 2.18, w: 9.1, h: 0.36, fontSize: 15, color: "8BA6C8" });
  s1.addShape(pptx.ShapeType.rect, { x: 0.48, y: 2.68, w: 8.6, h: 0.02, fill: { color: "2D4A6B" }, line: { color: "2D4A6B" } });
  s1.addText(`${company.sector}   ·   ${company.region}   ·   Scenario: ${scenario.toUpperCase()}`, { x: 0.48, y: 2.82, w: 9.1, h: 0.28, fontSize: 11, color: "7A94B0" });
  s1.addShape(pptx.ShapeType.rect, { x: 9.88, y: 0.85, w: 3.2, h: 5.65, fill: { color: C.navyMid }, line: { color: "2D4A6B" } });
  s1.addText("KEY METRICS", { x: 10.03, y: 1.02, w: 2.9, h: 0.24, fontSize: 8, bold: true, color: C.blue });
  const s1Metrics = [
    { label: "Implied Share Price", value: `${company.currency} ${blendedSharePrice.toFixed(2)}`, large: true },
    { label: `${blendLabel} Equity Value`, value: formatMoney(blendedEquityValue, company.currency), large: false },
    { label: `${blendLabel} EV`, value: formatMoney(blendedEnterpriseValue, company.currency), large: false },
    { label: "DCF EV", value: formatMoney(dcf.enterpriseValue, company.currency), large: false },
    { label: "Peer EV/EBITDA (median)", value: peerMult(medianEvEbitda), large: false },
  ];
  s1Metrics.forEach((m, i) => {
    const y = 1.42 + i * 0.9;
    s1.addText(m.value, { x: 10.03, y, w: 2.9, h: 0.38, fontSize: m.large ? 20 : 15, bold: true, color: m.large ? C.white : "C5D1DF", valign: "middle" });
    s1.addText(m.label, { x: 10.03, y: y + 0.4, w: 2.9, h: 0.2, fontSize: 8, color: "7A94B0" });
    if (i < s1Metrics.length - 1) s1.addShape(pptx.ShapeType.rect, { x: 10.03, y: y + 0.68, w: 2.9, h: 0.01, fill: { color: "1D3550" }, line: { color: "1D3550" } });
  });
  s1.addText(new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }), { x: 0.46, y: 6.85, w: 5, h: 0.22, fontSize: 8, color: "4A6480" });
  s1.addText("CONFIDENTIAL", { x: 5.46, y: 6.85, w: 7.7, h: 0.22, fontSize: 8, color: "4A6480", align: "right" });

  /* Slide 2: Executive Summary */
  const s2 = pptx.addSlide();
  s2.background = { color: "FAFBFC" };
  frame(s2, 2); eyebrow(s2, "EXECUTIVE SUMMARY");
  heading(s2, `${company.name} — ${scenario.charAt(0).toUpperCase() + scenario.slice(1)} Case`);
  kpiBox(s2, 0.28, 1.02, 3.12, 1.0, `${blendLabel} Enterprise Value`, formatMoney(blendedEnterpriseValue, company.currency), true);
  kpiBox(s2, 3.55, 1.02, 3.12, 1.0, `${blendLabel} Equity Value`, formatMoney(blendedEquityValue, company.currency));
  kpiBox(s2, 6.82, 1.02, 3.12, 1.0, "Implied Share Price", `${company.currency} ${blendedSharePrice.toFixed(2)}`);
  kpiBox(s2, 10.09, 1.02, 3.12, 1.0, "Peer Median EV/EBITDA", peerMult(medianEvEbitda));
  if (aiMemo?.recommendation) {
    s2.addShape(pptx.ShapeType.rect, { x: 0.28, y: 2.18, w: 3.5, h: 0.4, fill: { color: C.goldSoft }, line: { color: "F1D39A" } });
    s2.addText("RECOMMENDATION", { x: 0.42, y: 2.22, w: 1.55, h: 0.32, fontSize: 8, bold: true, color: C.muted });
    s2.addText(aiMemo.recommendation, { x: 2.05, y: 2.22, w: 1.65, h: 0.32, fontSize: 10, bold: true, color: C.gold, align: "right" });
  }
  const sumText = aiMemo?.summary || `${company.name} is a ${company.region}-based ${company.sector} company. Under the ${scenario} case, ${hasComps ? "the blended valuation triangulates to" : "the DCF alone (no comparable peers included) points to"} ${formatMoney(blendedEnterpriseValue, company.currency)} enterprise value, implying ${company.currency} ${blendedSharePrice.toFixed(2)} per share.`;
  s2.addText(sumText, { x: 0.28, y: 2.72, w: 12.85, h: 0.68, fontSize: 10, color: C.muted, valign: "top", fit: "shrink" });
  const s2Thesis = aiMemo?.thesis || [`Attractive sector exposure in ${company.sector}.`, "Model implies scalable EBITDA profile across the forecast period.", "Peer group multiple-based cross-check supports valuation range."];
  const s2Risks = aiMemo?.risks || [`Terminal value is ${terminalShare.toFixed(0)}% of DCF enterprise value.`, "Growth and margin assumptions drive most of the upside case.", "Peer multiple comparability requires business model validation."];
  [
    { label: "Investment thesis", items: s2Thesis, accent: C.blue, x: 0.28 },
    { label: "Key risks", items: s2Risks, accent: C.gold, x: 6.7 },
  ].forEach((col) => {
    s2.addShape(pptx.ShapeType.rect, { x: col.x, y: 3.55, w: 6.15, h: 3.1, fill: { color: C.panel }, line: { color: C.line } });
    s2.addShape(pptx.ShapeType.rect, { x: col.x, y: 3.55, w: 6.15, h: 0.04, fill: { color: col.accent }, line: { color: col.accent } });
    s2.addText(col.label, { x: col.x + 0.2, y: 3.68, w: 5.8, h: 0.3, fontSize: 13, bold: true, color: C.slate });
    col.items.slice(0, 3).forEach((item: string, i: number) => {
      s2.addShape(pptx.ShapeType.rect, { x: col.x + 0.2, y: 4.2 + i * 0.76, w: 0.06, h: 0.28, fill: { color: col.accent }, line: { color: col.accent } });
      s2.addText(item, { x: col.x + 0.38, y: 4.16 + i * 0.76, w: 5.7, h: 0.4, fontSize: 10, color: C.muted, valign: "top", fit: "shrink" });
    });
  });

  /* Slide 3: Projection */
  const s3 = pptx.addSlide();
  s3.background = { color: "FAFBFC" };
  frame(s3, 3); eyebrow(s3, "FINANCIAL MODEL");
  heading(s3, `Five-Year ${scenario.charAt(0).toUpperCase() + scenario.slice(1)} Case Projection  (${company.currency}m)`);
  const revenueCAGR = (Math.pow(proj[proj.length - 1].revenue / model.revenue, 1 / proj.length) - 1) * 100;
  const pjTable = [
    [hCell(""), ...proj.map((p) => hCell(`Year ${p.year}`)), hCell("CAGR")],
    [panelCell("Revenue Growth %", true), ...proj.map((p) => mutedCell(`${p.revenueGrowth.toFixed(1)}%`)), pjCell("", { fill: { color: C.panel } })],
    [blCell("Revenue", true), ...proj.map((p) => blCell(Math.round(p.revenue).toLocaleString())), blCell(`${revenueCAGR.toFixed(1)}%`)],
    [panelCell("EBITDA Margin %", true), ...proj.map((p) => mutedCell(`${p.ebitdaMargin.toFixed(1)}%`)), pjCell("", { fill: { color: C.panel } })],
    [panelCell("EBITDA", true), ...proj.map((p) => numCell(Math.round(p.ebitda).toLocaleString())), pjCell("", { fill: { color: C.panel } })],
    [panelCell("EBIT", true), ...proj.map((p) => numCell(Math.round(p.ebit).toLocaleString())), pjCell("", { fill: { color: C.panel } })],
    [blSoftCell("Free Cash Flow", true), ...proj.map((p) => blSoftCell(Math.round(p.fcf).toLocaleString())), pjCell("", { fill: { color: C.blueSoft } })],
  ];
  s3.addTable(pjTable as any, { x: 0.28, y: 1.0, w: 13.0, rowH: 0.48, fontSize: 10, border: { type: "solid", color: C.line, pt: 0.5 }, margin: [0.04, 0.12, 0.04, 0.12], colW: [2.7, 2.06, 2.06, 2.06, 2.06, 2.06, 0.9] as number[] });
  s3.addText("Key Assumptions", { x: 0.28, y: 4.52, w: 4, h: 0.28, fontSize: 12, bold: true, color: C.slate });
  [
    { label: "WACC", value: `${model.wacc.toFixed(1)}%` },
    { label: "Terminal Growth", value: `${model.terminalGrowth.toFixed(1)}%` },
    { label: "Exit Multiple", value: `${model.exitMultiple.toFixed(1)}x` },
    { label: "Net Debt", value: `${company.currency} ${model.netDebt.toLocaleString()}m` },
    { label: "Shares Out.", value: `${model.shares}m` },
  ].forEach((a, i) => kpiBox(s3, 0.28 + i * 2.54, 4.9, 2.3, 0.78, a.label, a.value));

  /* Slide 4: Football Field */
  const s4 = pptx.addSlide();
  s4.background = { color: "FAFBFC" };
  frame(s4, 4); eyebrow(s4, "VALUATION");
  heading(s4, "Football Field — Enterprise Value Range");
  const trackX = 3.55;
  const trackW = 7.55;
  const barColors = [C.blue, "4B9FF5", "7BC4F9", C.gold];
  valuationRows.forEach((row, i) => {
    const y = 1.18 + i * 1.35;
    const barLeft = trackX + (row.low / valuationScaleMax) * trackW;
    const barWidth = Math.max(((row.high - row.low) / valuationScaleMax) * trackW, 0.3);
    const isBlended = i === valuationRows.length - 1;
    s4.addText(row.label.toUpperCase(), { x: 0.25, y: y + 0.05, w: 3.1, h: 0.28, fontSize: 8.5, bold: true, color: isBlended ? C.navy : C.muted, align: "right" });
    s4.addShape(pptx.ShapeType.rect, { x: trackX, y: y + 0.13, w: trackW, h: 0.22, fill: { color: C.panel }, line: { color: C.line } });
    s4.addShape(pptx.ShapeType.rect, { x: barLeft, y: y + 0.06, w: barWidth, h: 0.36, fill: { color: barColors[i] }, line: { color: barColors[i] } });
    s4.addText(`${formatMoney(row.low, company.currency)} – ${formatMoney(row.high, company.currency)}`, { x: 11.24, y: y + 0.06, w: 2.0, h: 0.22, fontSize: 9, color: isBlended ? C.navy : C.slate, bold: isBlended });
    s4.addText(`SP: ${company.currency} ${enterpriseToSharePrice(row.low, model).toFixed(2)} – ${enterpriseToSharePrice(row.high, model).toFixed(2)}`, { x: 11.24, y: y + 0.3, w: 2.0, h: 0.18, fontSize: 8, color: C.muted });
  });
  [0, 0.25, 0.5, 0.75, 1.0].forEach((p) => {
    const x = trackX + p * trackW;
    s4.addText(`${Math.round(valuationScaleMax * p).toLocaleString()}`, { x: x - 0.5, y: 6.65, w: 1.0, h: 0.2, fontSize: 8, color: C.muted, align: "center" });
    s4.addShape(pptx.ShapeType.rect, { x, y: 6.62, w: 0.01, h: 0.08, fill: { color: C.line }, line: { color: C.line } });
  });
  s4.addText(`${company.currency}m`, { x: 0.25, y: 6.65, w: 3.1, h: 0.2, fontSize: 8, color: C.muted, align: "right" });

  /* Slide 5: Trading Comps */
  const s5 = pptx.addSlide();
  s5.background = { color: "FAFBFC" };
  frame(s5, 5); eyebrow(s5, "PEER GROUP");
  heading(s5, "Trading Comps");
  const compTable = [
    [
      pjCell("Company", { bold: true, color: C.white, fill: { color: C.navy }, align: "left" }),
      pjCell("Ticker", { bold: true, color: C.white, fill: { color: C.navy }, align: "center" }),
      pjCell("Incl.", { bold: true, color: C.white, fill: { color: C.navy }, align: "center" }),
      pjCell("Rev Growth", { bold: true, color: C.white, fill: { color: C.navy }, align: "center" }),
      pjCell("EBITDA Mgn", { bold: true, color: C.white, fill: { color: C.navy }, align: "center" }),
      pjCell("EV / Revenue", { bold: true, color: C.white, fill: { color: C.navy }, align: "center" }),
      pjCell("EV / EBITDA", { bold: true, color: C.white, fill: { color: C.navy }, align: "center" }),
    ],
    ...peers.map((p) => [
      pjCell(p.name, { bold: p.included, color: p.included ? C.slate : C.dim, align: "left" }),
      pjCell(p.ticker, { color: p.included ? C.muted : C.dim, align: "center" }),
      pjCell(p.included ? "✓" : "–", { bold: p.included, color: p.included ? C.blue : C.dim, align: "center" }),
      pjCell(`${p.revenueGrowth.toFixed(1)}%`, { color: p.included ? C.slate : C.dim, align: "center" }),
      pjCell(`${p.ebitdaMargin.toFixed(1)}%`, { color: p.included ? C.slate : C.dim, align: "center" }),
      pjCell(`${p.evRevenue.toFixed(1)}x`, { color: p.included ? C.slate : C.dim, align: "center" }),
      pjCell(`${p.evEbitda.toFixed(1)}x`, { color: p.included ? C.slate : C.dim, align: "center" }),
    ]),
    [
      pjCell("Median (included)", { bold: true, color: C.white, fill: { color: C.blue }, align: "left" }),
      pjCell("", { fill: { color: C.blue } }),
      pjCell("", { fill: { color: C.blue } }),
      ...(hasComps ? [
        `${median(medRows.map((p) => p.revenueGrowth)).toFixed(1)}%`,
        `${median(medRows.map((p) => p.ebitdaMargin)).toFixed(1)}%`,
        `${medianEvRevenue.toFixed(1)}x`,
        `${medianEvEbitda.toFixed(1)}x`,
      ] : ["n/a", "n/a", "n/a", "n/a"]).map((v) => pjCell(v, { bold: true, color: C.white, fill: { color: C.blue }, align: "center" })),
    ],
  ];
  s5.addTable(compTable as any, { x: 0.28, y: 1.0, w: 13.0, rowH: 0.44, fontSize: 10, border: { type: "solid", color: C.line, pt: 0.5 }, margin: [0.04, 0.12, 0.04, 0.12], colW: [3.0, 1.6, 0.9, 1.9, 1.9, 1.85, 1.85] as number[] });
  s5.addText(
    hasComps
      ? `Implied EV from median comps:  EV/Revenue → ${formatMoney(compsEvRevenue, company.currency)}  |  EV/EBITDA → ${formatMoney(compsEvEbitda, company.currency)}  |  Average → ${formatMoney(compsAvgEv, company.currency)}`
      : "No comparable peers included — the valuation rests on the DCF alone.",
    { x: 0.28, y: 1.0 + (peers.length + 2) * 0.44 + 0.22, w: 13.0, h: 0.3, fontSize: 10, bold: true, color: C.slate },
  );

  /* Slide 6: Sensitivity */
  const s6 = pptx.addSlide();
  s6.background = { color: "FAFBFC" };
  frame(s6, 6); eyebrow(s6, "SENSITIVITY ANALYSIS");
  heading(s6, `WACC vs. Terminal Growth — Implied Share Price (${company.currency})`);
  const allSensVals = sensitivityRows.flatMap((r) => r.values);
  const minSens = Math.min(...allSensVals);
  const maxSens = Math.max(...allSensVals);
  function sensOpts(v: number) {
    const ratio = maxSens === minSens ? 0.5 : (v - minSens) / (maxSens - minSens);
    if (ratio >= 0.67) return { bold: true, color: C.white, fill: { color: C.blue }, align: "center" as const };
    if (ratio <= 0.33) return { bold: true, color: C.white, fill: { color: C.gold }, align: "center" as const };
    return { bold: true, color: C.navy, fill: { color: C.panel }, align: "center" as const };
  }
  const sensTable = [
    [pjCell("WACC  ↓  |  g  →", { bold: true, color: C.white, fill: { color: C.navy }, align: "center" }), ...terminalGrowthColumns.map((g) => pjCell(`g = ${g.toFixed(1)}%`, { bold: true, color: C.white, fill: { color: C.navy }, align: "center" }))],
    ...sensitivityRows.map((row) => [
      pjCell(`${row.wacc.toFixed(1)}%`, { bold: true, color: C.white, fill: { color: C.blue }, align: "center" }),
      ...row.values.map((v) => pjCell(`${company.currency} ${v.toFixed(2)}`, sensOpts(v))),
    ]),
  ];
  s6.addTable(sensTable as any, { x: 2.9, y: 1.25, w: 7.5, rowH: 0.78, fontSize: 15, border: { type: "solid", color: C.line, pt: 0.5 }, margin: 0.1, colW: [1.9, 1.87, 1.87, 1.87] as number[] });
  s6.addText(`Base: WACC ${model.wacc.toFixed(1)}%  ·  Terminal growth ${model.terminalGrowth.toFixed(1)}%  ·  Exit multiple ${model.exitMultiple.toFixed(1)}x  ·  Net debt ${company.currency} ${model.netDebt.toLocaleString()}m`, { x: 0.28, y: 4.65, w: 13.0, h: 0.3, fontSize: 9, color: C.muted, align: "center" });

  /* Slide 7: Memo */
  const s7 = pptx.addSlide();
  s7.background = { color: "FAFBFC" };
  frame(s7, 7); eyebrow(s7, "INVESTMENT MEMO");
  heading(s7, `${company.name} — Initial View`);
  if (aiMemo?.recommendation) {
    s7.addShape(pptx.ShapeType.rect, { x: 10.15, y: 0.36, w: 3.0, h: 0.52, fill: { color: C.goldSoft }, line: { color: "F1D39A" } });
    s7.addText(aiMemo.recommendation, { x: 10.2, y: 0.38, w: 2.9, h: 0.48, fontSize: 12, bold: true, color: C.gold, align: "center", valign: "middle" });
  }
  const memoSummary = aiMemo?.summary || `${company.name} is a ${company.region}-based ${company.sector} company. Under the ${scenario} case, ${hasComps ? "the blended valuation triangulates to" : "the DCF alone (no comparable peers included) points to"} ${formatMoney(blendedEnterpriseValue, company.currency)} enterprise value with an implied share price of ${company.currency} ${blendedSharePrice.toFixed(2)}.`;
  s7.addText(memoSummary, { x: 0.28, y: 1.05, w: 13.0, h: 0.72, fontSize: 10.5, color: C.muted, valign: "top", fit: "shrink" });
  const memoThesis = aiMemo?.thesis || [`Attractive exposure to ${company.sector}.`, "Model implies scalable EBITDA profile through the five-year forecast.", "Peer group multiple cross-check supports valuation range."];
  const memoRisks = aiMemo?.risks || [`Terminal value is ${terminalShare.toFixed(0)}% of DCF enterprise value — high sensitivity.`, "Growth and margin assumptions drive most of the upside case.", "Peer multiple comparability requires business model validation."];
  [
    { label: "Investment thesis", items: memoThesis, accent: C.blue, x: 0.28, w: 6.1 },
    { label: "Key risks", items: memoRisks, accent: C.gold, x: 6.65, w: 6.55 },
  ].forEach((col) => {
    s7.addShape(pptx.ShapeType.rect, { x: col.x, y: 2.0, w: col.w, h: 4.65, fill: { color: C.panel }, line: { color: C.line } });
    s7.addShape(pptx.ShapeType.rect, { x: col.x, y: 2.0, w: col.w, h: 0.04, fill: { color: col.accent }, line: { color: col.accent } });
    s7.addText(col.label, { x: col.x + 0.2, y: 2.14, w: col.w - 0.4, h: 0.32, fontSize: 13, bold: true, color: C.slate });
    col.items.slice(0, 4).forEach((item: string, i: number) => {
      s7.addShape(pptx.ShapeType.rect, { x: col.x + 0.2, y: 2.64 + i * 0.92, w: 0.06, h: 0.3, fill: { color: col.accent }, line: { color: col.accent } });
      s7.addText(item, { x: col.x + 0.38, y: 2.6 + i * 0.92, w: col.w - 0.58, h: 0.46, fontSize: 10.5, color: C.muted, valign: "top", fit: "shrink" });
    });
  });

  await pptx.writeFile({ fileName: `${company.ticker || "dealdesk"}-investment-memo.pptx` });
}
