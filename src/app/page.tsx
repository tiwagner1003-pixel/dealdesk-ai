"use client";

import { useMemo, useRef, useState } from "react";

type CompanyInput = {
  name: string;
  ticker: string;
  sector: string;
  region: string;
  currency: string;
};

type ModelInput = {
  revenue: number;
  depreciationPercent: number;
  taxRate: number;
  capexPercent: number;
  nwcPercent: number;
  netDebt: number;
  shares: number;
  wacc: number;
  terminalGrowth: number;
  exitMultiple: number;
};

type Peer = {
  included: boolean;
  name: string;
  ticker: string;
  revenueGrowth: number;
  ebitdaMargin: number;
  evRevenue: number;
  evEbitda: number;
};

type ForecastYear = {
  year: number;
  revenueGrowth: number;
  ebitdaMargin: number;
};

type Scenario = "base" | "upside" | "downside";
type WorkspaceTab = "setup" | "model" | "peers" | "valuation" | "memo";

type AiMemo = {
  recommendation: string;
  summary: string;
  thesis: string[];
  risks: string[];
  deckOutline: string[];
  source: string;
};

const WORKFLOW_TABS: { id: WorkspaceTab; label: string; description: string }[] = [
  { id: "setup", label: "Case Setup", description: "Company and scenario" },
  { id: "model", label: "Model", description: "Operating assumptions" },
  { id: "peers", label: "Peers", description: "Trading comps" },
  { id: "valuation", label: "Valuation", description: "DCF and outputs" },
  { id: "memo", label: "Memo", description: "Investment view" },
];

const INITIAL_COMPANY: CompanyInput = {
  name: "Adyen",
  ticker: "ADYEN.AS",
  sector: "Payments / FinTech",
  region: "Europe",
  currency: "EUR",
};

const INITIAL_MODEL: ModelInput = {
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

const INITIAL_FORECAST: ForecastYear[] = [
  { year: 1, revenueGrowth: 15, ebitdaMargin: 45 },
  { year: 2, revenueGrowth: 14, ebitdaMargin: 46 },
  { year: 3, revenueGrowth: 12, ebitdaMargin: 47 },
  { year: 4, revenueGrowth: 10, ebitdaMargin: 48 },
  { year: 5, revenueGrowth: 8, ebitdaMargin: 49 },
];

const INITIAL_PEERS: Peer[] = [
  {
    included: true,
    name: "PayPal",
    ticker: "PYPL",
    revenueGrowth: 7,
    ebitdaMargin: 24,
    evRevenue: 2.4,
    evEbitda: 9.8,
  },
  {
    included: true,
    name: "Block",
    ticker: "SQ",
    revenueGrowth: 11,
    ebitdaMargin: 18,
    evRevenue: 1.8,
    evEbitda: 12.6,
  },
  {
    included: true,
    name: "Wise",
    ticker: "WISE.L",
    revenueGrowth: 18,
    ebitdaMargin: 32,
    evRevenue: 6.2,
    evEbitda: 19.4,
  },
  {
    included: true,
    name: "Nexi",
    ticker: "NEXI.MI",
    revenueGrowth: 5,
    ebitdaMargin: 50,
    evRevenue: 3.1,
    evEbitda: 8.7,
  },
];

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value) + ` ${currency}m`;
}

function formatMultiple(value: number) {
  return `${value.toFixed(1)}x`;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length === 0) return 0;
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function percentile(values: number[], percentileValue: number) {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;

  const index = (sorted.length - 1) * percentileValue;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function pct(value: number) {
  return value / 100;
}

function getScenarioAdjustment(scenario: Scenario) {
  if (scenario === "upside") return { growth: 3, margin: 2 };
  if (scenario === "downside") return { growth: -4, margin: -3 };
  return { growth: 0, margin: 0 };
}

function calculateProjection(model: ModelInput, forecast: ForecastYear[], scenario: Scenario) {
  const scenarioAdjustment = getScenarioAdjustment(scenario);
  let revenue = model.revenue;

  return forecast.map((assumption) => {
    const growth = assumption.revenueGrowth + scenarioAdjustment.growth;
    const margin = assumption.ebitdaMargin + scenarioAdjustment.margin;
    revenue *= 1 + pct(growth);
    const ebitda = revenue * pct(margin);
    const depreciation = revenue * pct(model.depreciationPercent);
    const ebit = ebitda - depreciation;
    const tax = Math.max(0, ebit * pct(model.taxRate));
    const capex = revenue * pct(model.capexPercent);
    const nwc = revenue * pct(model.nwcPercent);
    const fcf = ebit - tax + depreciation - capex - nwc;

    return {
      year: assumption.year,
      revenueGrowth: growth,
      ebitdaMargin: margin,
      revenue,
      ebitda,
      ebit,
      fcf,
    };
  });
}

function calculateDcf(model: ModelInput, forecast: ForecastYear[], scenario: Scenario) {
  const projection = calculateProjection(model, forecast, scenario);
  const discountRate = pct(model.wacc);
  const terminalGrowth = pct(model.terminalGrowth);
  const pvFcfs = projection.map((row) => row.fcf / (1 + discountRate) ** row.year);
  const finalFcf = projection[projection.length - 1].fcf;
  const finalEbitda = projection[projection.length - 1].ebitda;
  const gordonTerminalValue = (finalFcf * (1 + terminalGrowth)) / Math.max(discountRate - terminalGrowth, 0.01);
  const exitTerminalValue = finalEbitda * model.exitMultiple;
  const pvGordonTerminal = gordonTerminalValue / (1 + discountRate) ** projection.length;
  const pvExitTerminal = exitTerminalValue / (1 + discountRate) ** projection.length;
  const pvForecast = pvFcfs.reduce((sum, value) => sum + value, 0);
  const gordonEnterpriseValue = pvForecast + pvGordonTerminal;
  const exitEnterpriseValue = pvForecast + pvExitTerminal;
  const enterpriseValue = (gordonEnterpriseValue + exitEnterpriseValue) / 2;
  const equityValue = enterpriseValue - model.netDebt;
  const sharePrice = model.shares > 0 ? equityValue / model.shares : 0;

  return {
    projection,
    enterpriseValue,
    gordonEnterpriseValue,
    exitEnterpriseValue,
    equityValue,
    sharePrice,
    pvTerminal: (pvGordonTerminal + pvExitTerminal) / 2,
  };
}

function enterpriseToSharePrice(enterpriseValue: number, model: ModelInput) {
  return model.shares > 0 ? (enterpriseValue - model.netDebt) / model.shares : 0;
}

export default function Home() {
  const [company, setCompany] = useState(INITIAL_COMPANY);
  const [model, setModel] = useState(INITIAL_MODEL);
  const [forecast, setForecast] = useState(INITIAL_FORECAST);
  const [peers, setPeers] = useState(INITIAL_PEERS);
  const [scenario, setScenario] = useState<Scenario>("base");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("setup");
  const [aiMemo, setAiMemo] = useState<AiMemo | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  const includedPeers = useMemo(() => peers.filter((peer) => peer.included), [peers]);
  const valuationPeers = includedPeers.length > 0 ? includedPeers : peers;
  const dcf = useMemo(() => calculateDcf(model, forecast, scenario), [model, forecast, scenario]);
  const downsideDcf = useMemo(() => calculateDcf(model, forecast, "downside"), [model, forecast]);
  const baseDcf = useMemo(() => calculateDcf(model, forecast, "base"), [model, forecast]);
  const upsideDcf = useMemo(() => calculateDcf(model, forecast, "upside"), [model, forecast]);
  const medianEvRevenue = useMemo(() => median(valuationPeers.map((peer) => peer.evRevenue)), [valuationPeers]);
  const medianEvEbitda = useMemo(() => median(valuationPeers.map((peer) => peer.evEbitda)), [valuationPeers]);
  const evRevenueLow = useMemo(() => percentile(valuationPeers.map((peer) => peer.evRevenue), 0.25), [valuationPeers]);
  const evRevenueHigh = useMemo(() => percentile(valuationPeers.map((peer) => peer.evRevenue), 0.75), [valuationPeers]);
  const evEbitdaLow = useMemo(() => percentile(valuationPeers.map((peer) => peer.evEbitda), 0.25), [valuationPeers]);
  const evEbitdaHigh = useMemo(() => percentile(valuationPeers.map((peer) => peer.evEbitda), 0.75), [valuationPeers]);
  const currentEbitda = model.revenue * pct(forecast[0]?.ebitdaMargin || 0);
  const compsEvRevenue = model.revenue * medianEvRevenue;
  const compsEvEbitda = currentEbitda * medianEvEbitda;
  const compsRevenueLow = model.revenue * evRevenueLow;
  const compsRevenueHigh = model.revenue * evRevenueHigh;
  const compsEbitdaLow = currentEbitda * evEbitdaLow;
  const compsEbitdaHigh = currentEbitda * evEbitdaHigh;
  const blendedEnterpriseValue = (dcf.enterpriseValue + compsEvRevenue + compsEvEbitda) / 3;
  const blendedEquityValue = blendedEnterpriseValue - model.netDebt;
  const blendedSharePrice = model.shares > 0 ? blendedEquityValue / model.shares : 0;
  const nextRevenue = dcf.projection[0]?.revenue || model.revenue;
  const terminalShare = dcf.enterpriseValue > 0 ? (dcf.pvTerminal / dcf.enterpriseValue) * 100 : 0;
  const dcfRange = [downsideDcf.enterpriseValue, baseDcf.enterpriseValue, upsideDcf.enterpriseValue];
  const blendedLow = (downsideDcf.enterpriseValue + compsRevenueLow + compsEbitdaLow) / 3;
  const blendedHigh = (upsideDcf.enterpriseValue + compsRevenueHigh + compsEbitdaHigh) / 3;
  const valuationRows = [
    { label: "DCF", low: Math.min(...dcfRange), high: Math.max(...dcfRange) },
    { label: "EV / Revenue", low: compsRevenueLow, high: compsRevenueHigh },
    { label: "EV / EBITDA", low: compsEbitdaLow, high: compsEbitdaHigh },
    { label: "Blended range", low: blendedLow, high: blendedHigh },
  ];
  const valuationScaleMax = Math.max(...valuationRows.map((row) => row.high), 1);
  const sensitivityRows = [model.wacc - 1, model.wacc, model.wacc + 1].map((wacc) => ({
    wacc,
    values: [model.terminalGrowth - 0.5, model.terminalGrowth, model.terminalGrowth + 0.5].map((terminalGrowth) => {
      const sensitivityModel = { ...model, wacc, terminalGrowth };
      return calculateDcf(sensitivityModel, forecast, scenario).sharePrice;
    }),
  }));
  const terminalGrowthColumns = [model.terminalGrowth - 0.5, model.terminalGrowth, model.terminalGrowth + 0.5];
  const casePayload = {
    company,
    model,
    forecast,
    peers,
    scenario,
    outputs: {
      dcfEnterpriseValue: dcf.enterpriseValue,
      dcfEquityValue: dcf.equityValue,
      blendedEnterpriseValue,
      blendedEquityValue,
      blendedSharePrice,
      medianEvRevenue,
      medianEvEbitda,
      terminalShare,
    },
  };

  function updateCompany(field: keyof CompanyInput, value: string) {
    setCompany((current) => ({ ...current, [field]: value }));
  }

  function updateModel(field: keyof ModelInput, value: string) {
    setModel((current) => ({ ...current, [field]: Number(value) || 0 }));
  }

  function updateForecast(index: number, field: keyof ForecastYear, value: string) {
    setForecast((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: Number(value) || 0,
            }
          : row,
      ),
    );
  }

  function updatePeer(index: number, field: keyof Peer, value: string) {
    setPeers((current) =>
      current.map((peer, peerIndex) =>
        peerIndex === index
          ? {
              ...peer,
              [field]:
                field === "name" || field === "ticker"
                  ? value
                  : field === "included"
                    ? value === "true"
                    : Number(value) || 0,
            }
          : peer,
      ),
    );
  }

  function addPeer() {
    setPeers((current) => [
      ...current,
      {
        name: "New Peer",
        included: true,
        ticker: "TICK",
        revenueGrowth: 8,
        ebitdaMargin: 25,
        evRevenue: 3,
        evEbitda: 10,
      },
    ]);
  }

  function removePeer(index: number) {
    setPeers((current) => current.filter((_peer, peerIndex) => peerIndex !== index));
  }

  async function exportExcelModel() {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();

    const caseSetup = [
      ["DealDesk AI", `${company.name} valuation case`],
      ["Company", company.name],
      ["Ticker", company.ticker],
      ["Sector", company.sector],
      ["Region", company.region],
      ["Currency", company.currency],
      ["Scenario", scenario],
    ];

    const assumptions = [
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
    ];

    const forecastRows = [
      ["Year", "Revenue Growth %", "EBITDA Margin %"],
      ...forecast.map((row) => [`Y${row.year}`, row.revenueGrowth, row.ebitdaMargin]),
    ];

    const dcfRows = [
      ["Metric", "Value"],
      ["Gordon Growth EV", dcf.gordonEnterpriseValue],
      ["Exit Multiple EV", dcf.exitEnterpriseValue],
      ["Blended DCF EV", dcf.enterpriseValue],
      ["Equity Value", dcf.equityValue],
      ["Share Price", dcf.sharePrice],
      ["Terminal Value Share %", terminalShare],
    ];

    const peerRows = [
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
    ];

    const sensitivity = [
      ["WACC / Terminal Growth", ...terminalGrowthColumns.map((growth) => `${growth.toFixed(1)}%`)],
      ...sensitivityRows.map((row) => [`${row.wacc.toFixed(1)}%`, ...row.values.map((value) => Number(value.toFixed(2)))]),
    ];

    const memoInputs = [
      ["Metric", "Value"],
      ["Blended EV", blendedEnterpriseValue],
      ["Blended Equity Value", blendedEquityValue],
      ["Blended Share Price", blendedSharePrice],
      ["Peer Median EV/Revenue", medianEvRevenue],
      ["Peer Median EV/EBITDA", medianEvEbitda],
      ["Valuation Range Low", blendedLow],
      ["Valuation Range High", blendedHigh],
    ];

    [
      ["Case Setup", caseSetup],
      ["Assumptions", assumptions],
      ["Forecast", forecastRows],
      ["DCF", dcfRows],
      ["Trading Comps", peerRows],
      ["Sensitivity", sensitivity],
      ["Memo Inputs", memoInputs],
    ].forEach(([sheetName, rows]) => {
      const worksheet = XLSX.utils.aoa_to_sheet(rows as (string | number)[][]);
      worksheet["!cols"] = Array.from({ length: 8 }, () => ({ wch: 22 }));
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName as string);
    });

    XLSX.writeFile(workbook, `${company.ticker || "dealdesk"}-valuation-model.xlsx`);
  }

  async function importExcelModel(file: File) {
    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const getRows = (sheetName: string) =>
      workbook.Sheets[sheetName]
        ? (XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as (string | number)[][])
        : [];
    const valueMap = (rows: (string | number)[][]) =>
      new Map(rows.slice(1).map((row) => [String(row[0] || ""), row[1]]));

    const caseRows = valueMap(getRows("Case Setup"));
    const assumptionRows = valueMap(getRows("Assumptions"));
    const forecastRows = getRows("Forecast").slice(1);
    const peerRows = getRows("Trading Comps").slice(1);

    setCompany({
      name: String(caseRows.get("Company") || company.name),
      ticker: String(caseRows.get("Ticker") || company.ticker),
      sector: String(caseRows.get("Sector") || company.sector),
      region: String(caseRows.get("Region") || company.region),
      currency: String(caseRows.get("Currency") || company.currency),
    });

    setModel({
      revenue: Number(assumptionRows.get("Revenue") || model.revenue),
      depreciationPercent: Number(assumptionRows.get("D&A / Revenue %") || model.depreciationPercent),
      taxRate: Number(assumptionRows.get("Tax Rate %") || model.taxRate),
      capexPercent: Number(assumptionRows.get("Capex / Revenue %") || model.capexPercent),
      nwcPercent: Number(assumptionRows.get("NWC / Revenue %") || model.nwcPercent),
      netDebt: Number(assumptionRows.get("Net Debt") || model.netDebt),
      shares: Number(assumptionRows.get("Shares Outstanding") || model.shares),
      wacc: Number(assumptionRows.get("WACC %") || model.wacc),
      terminalGrowth: Number(assumptionRows.get("Terminal Growth %") || model.terminalGrowth),
      exitMultiple: Number(assumptionRows.get("Exit Multiple") || model.exitMultiple),
    });

    if (forecastRows.length > 0) {
      setForecast(
        forecastRows.slice(0, 5).map((row, index) => ({
          year: index + 1,
          revenueGrowth: Number(row[1] || 0),
          ebitdaMargin: Number(row[2] || 0),
        })),
      );
    }

    if (peerRows.length > 0) {
      setPeers(
        peerRows.map((row) => ({
          included: String(row[0] || "Yes").toLowerCase() !== "no",
          name: String(row[1] || "Peer"),
          ticker: String(row[2] || "TICK"),
          revenueGrowth: Number(row[3] || 0),
          ebitdaMargin: Number(row[4] || 0),
          evRevenue: Number(row[5] || 0),
          evEbitda: Number(row[6] || 0),
        })),
      );
    }

    setStatusMessage("Excel model imported.");
  }

  async function exportPowerPointDeck() {
    const pptxgen = (await import("pptxgenjs")).default;
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "DealDesk AI";
    pptx.subject = `${company.name} valuation case`;
    pptx.title = `${company.name} Investment Memo`;
    pptx.company = "DealDesk AI";
    pptx.theme = {
      headFontFace: "Aptos Display",
      bodyFontFace: "Aptos",
    };

    const navy = "0B1F3A";
    const blue = "2563EB";
    const gold = "B7791F";
    const slate = "17212F";
    const muted = "657083";

    function addFooter(slide: any, page: number) {
      slide.addText(`DealDesk AI | ${company.ticker} | ${page}`, {
        x: 0.45,
        y: 7.05,
        w: 12.4,
        h: 0.18,
        fontSize: 7,
        color: "7A8494",
      });
    }

    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: navy };
    titleSlide.addText("DealDesk AI", { x: 0.5, y: 0.45, w: 2.5, h: 0.35, color: "FFFFFF", fontSize: 16, bold: true });
    titleSlide.addText(`${company.name} valuation case`, { x: 0.65, y: 2.25, w: 8.2, h: 0.65, color: "FFFFFF", fontSize: 34, bold: true });
    titleSlide.addText(`${company.sector} | ${company.region} | ${scenario} case`, { x: 0.68, y: 3.05, w: 8.2, h: 0.32, color: "C5D1DF", fontSize: 15 });
    titleSlide.addShape(pptx.ShapeType.rect, { x: 9.5, y: 1.2, w: 2.9, h: 3.4, fill: { color: "132B4A" }, line: { color: "304A6B" } });
    titleSlide.addText(`${company.currency} ${blendedSharePrice.toFixed(2)}`, { x: 9.8, y: 2.05, w: 2.4, h: 0.45, color: "FFFFFF", fontSize: 24, bold: true });
    titleSlide.addText("Implied share price", { x: 9.8, y: 2.56, w: 2.4, h: 0.3, color: "C5D1DF", fontSize: 11 });
    titleSlide.addText(formatMoney(blendedEquityValue, company.currency), { x: 9.8, y: 3.2, w: 2.4, h: 0.35, color: "FFFFFF", fontSize: 18, bold: true });
    titleSlide.addText("Blended equity value", { x: 9.8, y: 3.58, w: 2.4, h: 0.3, color: "C5D1DF", fontSize: 11 });

    const summarySlide = pptx.addSlide();
    summarySlide.addText("Valuation summary", { x: 0.5, y: 0.35, w: 5.5, h: 0.4, color: navy, fontSize: 24, bold: true });
    [
      ["DCF EV", formatMoney(dcf.enterpriseValue, company.currency)],
      ["Comps EV", formatMoney((compsEvRevenue + compsEvEbitda) / 2, company.currency)],
      ["Blended EV", formatMoney(blendedEnterpriseValue, company.currency)],
      ["Share price", `${company.currency} ${blendedSharePrice.toFixed(2)}`],
    ].forEach(([label, value], index) => {
      const x = 0.55 + index * 3.1;
      summarySlide.addShape(pptx.ShapeType.rect, { x, y: 1.05, w: 2.75, h: 1.15, fill: { color: index === 2 ? blue : "F4F7FB" }, line: { color: index === 2 ? blue : "D7DEE8" } });
      summarySlide.addText(value, { x: x + 0.18, y: 1.25, w: 2.35, h: 0.3, color: index === 2 ? "FFFFFF" : slate, fontSize: 17, bold: true });
      summarySlide.addText(label, { x: x + 0.18, y: 1.62, w: 2.35, h: 0.22, color: index === 2 ? "DDE8FF" : muted, fontSize: 9, bold: true });
    });
    summarySlide.addText("Football field range", { x: 0.55, y: 2.75, w: 3, h: 0.3, color: navy, fontSize: 15, bold: true });
    valuationRows.forEach((row, index) => {
      const y = 3.2 + index * 0.55;
      const left = 3.3 + (row.low / valuationScaleMax) * 5.6;
      const width = Math.max(((row.high - row.low) / valuationScaleMax) * 5.6, 0.25);
      summarySlide.addText(row.label, { x: 0.7, y, w: 1.7, h: 0.25, color: muted, fontSize: 9, bold: true });
      summarySlide.addShape(pptx.ShapeType.rect, { x: 2.65, y: y + 0.06, w: 6.4, h: 0.12, fill: { color: "EDF2F8" }, line: { color: "EDF2F8" } });
      summarySlide.addShape(pptx.ShapeType.rect, { x: left, y: y + 0.02, w: width, h: 0.2, fill: { color: index === 3 ? gold : blue }, line: { color: index === 3 ? gold : blue } });
      summarySlide.addText(`${formatMoney(row.low, company.currency)} - ${formatMoney(row.high, company.currency)}`, { x: 9.3, y, w: 2.7, h: 0.25, color: slate, fontSize: 9 });
    });
    addFooter(summarySlide, 2);

    const compsSlide = pptx.addSlide();
    compsSlide.addText("Trading comps", { x: 0.5, y: 0.35, w: 5.5, h: 0.4, color: navy, fontSize: 24, bold: true });
    const tableRows = [["Company", "Ticker", "In", "Growth", "EBITDA", "EV/Rev", "EV/EBITDA"], ...peers.map((peer) => [peer.name, peer.ticker, peer.included ? "Yes" : "No", `${peer.revenueGrowth}%`, `${peer.ebitdaMargin}%`, `${peer.evRevenue}x`, `${peer.evEbitda}x`])];
    compsSlide.addTable(tableRows as any, {
      x: 0.55,
      y: 1.0,
      w: 12.1,
      h: 3.8,
      border: { color: "D7DEE8", pt: 0.5 },
      fontSize: 9,
      color: slate,
      fill: { color: "FFFFFF" },
      margin: 0.06,
    });
    compsSlide.addText(`Median included peer EV/Revenue: ${formatMultiple(medianEvRevenue)} | EV/EBITDA: ${formatMultiple(medianEvEbitda)}`, {
      x: 0.65,
      y: 5.35,
      w: 10.5,
      h: 0.35,
      color: navy,
      fontSize: 14,
      bold: true,
    });
    addFooter(compsSlide, 3);

    const memoSlide = pptx.addSlide();
    memoSlide.addText("Investment memo", { x: 0.5, y: 0.35, w: 5.5, h: 0.4, color: navy, fontSize: 24, bold: true });
    memoSlide.addText(`${company.name} is a ${company.region}-based ${company.sector} company. The ${scenario} case implies a blended EV of ${formatMoney(blendedEnterpriseValue, company.currency)} and a share price of ${company.currency} ${blendedSharePrice.toFixed(2)}.`, {
      x: 0.6,
      y: 1.05,
      w: 11.5,
      h: 0.7,
      color: slate,
      fontSize: 14,
      breakLine: false,
      fit: "shrink",
    });
    memoSlide.addText("Investment thesis", { x: 0.65, y: 2.1, w: 4, h: 0.3, color: navy, fontSize: 15, bold: true });
    memoSlide.addText("• Attractive exposure to " + company.sector + "\n• Scalable EBITDA profile in forecast period\n• Peer group supports valuation cross-check", { x: 0.75, y: 2.55, w: 5.2, h: 1.4, color: muted, fontSize: 12, breakLine: false });
    memoSlide.addText("Key risks", { x: 6.65, y: 2.1, w: 4, h: 0.3, color: navy, fontSize: 15, bold: true });
    memoSlide.addText(`• Terminal value is ${terminalShare.toFixed(0)}% of DCF EV\n• Growth and margin assumptions require diligence\n• Peer multiples need business-model validation`, { x: 6.75, y: 2.55, w: 5.3, h: 1.4, color: muted, fontSize: 12, breakLine: false });
    addFooter(memoSlide, 4);

    await pptx.writeFile({ fileName: `${company.ticker || "dealdesk"}-investment-memo.pptx` });
  }

  async function generateAiMemo() {
    setAiLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/ai-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(casePayload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI memo generation failed.");
      }

      setAiMemo(data.memo);
      setStatusMessage(data.memo.source === "fallback" ? "Memo generated with local fallback. Add OPENAI_API_KEY for AI output." : "AI memo generated.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "AI memo generation failed.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="brand">
            <span className="brand-mark">D</span>
            DealDesk AI
          </div>
          <p>Finance analyst workbench for modeling, valuation, peer groups, and investment memos.</p>
        </div>
        <div className="topbar-actions">
          <input
            ref={excelInputRef}
            className="hidden-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importExcelModel(file);
              event.currentTarget.value = "";
            }}
          />
          <button className="ghost-button" onClick={() => excelInputRef.current?.click()} type="button">
            Import Excel
          </button>
          <button className="ghost-button" onClick={exportExcelModel} type="button">
            Export Excel
          </button>
          <button type="button" onClick={exportPowerPointDeck}>
            Create pitch deck
          </button>
        </div>
      </header>
      {statusMessage && <p className="status-banner">{statusMessage}</p>}

      <section className="hero-panel">
        <div>
          <p className="eyebrow">Analyst Workspace</p>
          <h1>{company.name || "Company"} valuation case</h1>
          <p>
            Build a simple financial model, benchmark peers, triangulate valuation, and draft an investment memo from one workspace.
          </p>
        </div>
        <div className="hero-metrics">
          <div>
            <span>Blended equity value</span>
            <strong>{formatMoney(blendedEquityValue, company.currency)}</strong>
          </div>
          <div>
            <span>Implied share price</span>
            <strong>
              {company.currency} {blendedSharePrice.toFixed(2)}
            </strong>
          </div>
          <div>
            <span>Peer median EV/EBITDA</span>
            <strong>{formatMultiple(medianEvEbitda)}</strong>
          </div>
        </div>
      </section>

      <nav className="workflow-tabs" aria-label="DealDesk workflow">
        {WORKFLOW_TABS.map((tab) => (
          <button
            className={activeTab === tab.id ? "active" : ""}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <strong>{tab.label}</strong>
            <span>{tab.description}</span>
          </button>
        ))}
      </nav>

      <section className="deal-layout">
        <div className="main-stack">
          {activeTab === "setup" && (
            <section className="panel workspace-panel">
              <div className="section-heading horizontal">
                <div>
                  <p className="eyebrow">Company Input</p>
                  <h2>Case setup</h2>
                </div>
                <span>Set the investment case context before modeling.</span>
              </div>

              <div className="setup-grid">
                <label>
                  Company
                  <input value={company.name} onChange={(event) => updateCompany("name", event.target.value)} />
                </label>
                <label>
                  Ticker
                  <input value={company.ticker} onChange={(event) => updateCompany("ticker", event.target.value)} />
                </label>
                <label>
                  Sector
                  <input value={company.sector} onChange={(event) => updateCompany("sector", event.target.value)} />
                </label>
                <label>
                  Region
                  <input value={company.region} onChange={(event) => updateCompany("region", event.target.value)} />
                </label>
                <label>
                  Currency
                  <input value={company.currency} onChange={(event) => updateCompany("currency", event.target.value.toUpperCase())} />
                </label>
              </div>

              <div className="scenario-panel">
                <div>
                  <p className="eyebrow">Scenario</p>
                  <h3>Valuation case</h3>
                </div>
                <div className="segmented-control">
                  {(["downside", "base", "upside"] as Scenario[]).map((item) => (
                    <button
                      className={scenario === item ? "active" : ""}
                      key={item}
                      onClick={() => setScenario(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === "model" && (
          <section className="panel workspace-panel model-panel">
            <div className="section-heading horizontal">
              <div>
                <p className="eyebrow">Financial Model</p>
                <h2>Operating assumptions</h2>
              </div>
              <span>{company.currency}m unless stated</span>
            </div>

            <div className="input-grid">
              <label>
                Revenue
                <input type="number" value={model.revenue} onChange={(event) => updateModel("revenue", event.target.value)} />
              </label>
              <label>
                D&A / revenue %
                <input type="number" value={model.depreciationPercent} onChange={(event) => updateModel("depreciationPercent", event.target.value)} />
              </label>
              <label>
                Tax rate %
                <input type="number" value={model.taxRate} onChange={(event) => updateModel("taxRate", event.target.value)} />
              </label>
              <label>
                Capex / revenue %
                <input type="number" value={model.capexPercent} onChange={(event) => updateModel("capexPercent", event.target.value)} />
              </label>
              <label>
                NWC / revenue %
                <input type="number" value={model.nwcPercent} onChange={(event) => updateModel("nwcPercent", event.target.value)} />
              </label>
              <label>
                Net debt
                <input type="number" value={model.netDebt} onChange={(event) => updateModel("netDebt", event.target.value)} />
              </label>
              <label>
                Shares outstanding
                <input type="number" value={model.shares} onChange={(event) => updateModel("shares", event.target.value)} />
              </label>
              <label>
                WACC %
                <input type="number" value={model.wacc} onChange={(event) => updateModel("wacc", event.target.value)} />
              </label>
              <label>
                Terminal growth %
                <input type="number" value={model.terminalGrowth} onChange={(event) => updateModel("terminalGrowth", event.target.value)} />
              </label>
              <label>
                Exit multiple
                <input type="number" value={model.exitMultiple} onChange={(event) => updateModel("exitMultiple", event.target.value)} />
              </label>
            </div>

            <div className="forecast-table" role="table" aria-label="Yearly forecast assumptions">
              <div className="forecast-row header" role="row">
                <span>Year</span>
                <span>Revenue growth %</span>
                <span>EBITDA margin %</span>
              </div>
              {forecast.map((row, index) => (
                <div className="forecast-row" key={row.year} role="row">
                  <strong>Y{row.year}</strong>
                  <input
                    type="number"
                    value={row.revenueGrowth}
                    onChange={(event) => updateForecast(index, "revenueGrowth", event.target.value)}
                  />
                  <input
                    type="number"
                    value={row.ebitdaMargin}
                    onChange={(event) => updateForecast(index, "ebitdaMargin", event.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>
          )}

          {activeTab === "valuation" && (
          <section className="analytics-grid">
            <article className="panel valuation-card">
              <p className="eyebrow">DCF Output</p>
              <h2>{formatMoney(dcf.enterpriseValue, company.currency)}</h2>
              <span>Enterprise value</span>
              <div className="valuation-list">
                <div>
                  <span>Gordon growth EV</span>
                  <strong>{formatMoney(dcf.gordonEnterpriseValue, company.currency)}</strong>
                </div>
                <div>
                  <span>Exit multiple EV</span>
                  <strong>{formatMoney(dcf.exitEnterpriseValue, company.currency)}</strong>
                </div>
                <div>
                  <span>Equity value</span>
                  <strong>{formatMoney(dcf.equityValue, company.currency)}</strong>
                </div>
                <div>
                  <span>Share price</span>
                  <strong>
                    {company.currency} {dcf.sharePrice.toFixed(2)}
                  </strong>
                </div>
                <div>
                  <span>Terminal value share</span>
                  <strong>{terminalShare.toFixed(0)}%</strong>
                </div>
              </div>
            </article>

            <article className="panel valuation-card">
              <p className="eyebrow">Trading Comps</p>
              <h2>{formatMoney((compsEvRevenue + compsEvEbitda) / 2, company.currency)}</h2>
              <span>Average comps EV</span>
              <div className="valuation-list">
                <div>
                  <span>EV / Revenue</span>
                  <strong>{formatMultiple(medianEvRevenue)}</strong>
                </div>
                <div>
                  <span>EV / EBITDA</span>
                  <strong>{formatMultiple(medianEvEbitda)}</strong>
                </div>
                <div>
                  <span>Current EBITDA</span>
                  <strong>{formatMoney(currentEbitda, company.currency)}</strong>
                </div>
              </div>
            </article>
          </section>
          )}

          {activeTab === "peers" && (
          <section className="panel workspace-panel">
            <div className="section-heading horizontal">
              <div>
                <p className="eyebrow">Peer Group</p>
                <h2>Comparable companies</h2>
              </div>
              <button className="ghost-button" onClick={addPeer} type="button">
                Add peer
              </button>
            </div>

            <div className="peer-table" role="table" aria-label="Peer group table">
              <div className="peer-row header" role="row">
                <span>Company</span>
                <span>Ticker</span>
                <span>Growth %</span>
                <span>EBITDA %</span>
                <span>EV/Rev</span>
                <span>EV/EBITDA</span>
                <span />
              </div>
              {peers.map((peer, index) => (
                <div className={`peer-row ${peer.included ? "" : "excluded"}`} key={`${peer.ticker}-${index}`} role="row">
                  <input value={peer.name} onChange={(event) => updatePeer(index, "name", event.target.value)} />
                  <input value={peer.ticker} onChange={(event) => updatePeer(index, "ticker", event.target.value.toUpperCase())} />
                  <input type="number" value={peer.revenueGrowth} onChange={(event) => updatePeer(index, "revenueGrowth", event.target.value)} />
                  <input type="number" value={peer.ebitdaMargin} onChange={(event) => updatePeer(index, "ebitdaMargin", event.target.value)} />
                  <input type="number" value={peer.evRevenue} onChange={(event) => updatePeer(index, "evRevenue", event.target.value)} />
                  <input type="number" value={peer.evEbitda} onChange={(event) => updatePeer(index, "evEbitda", event.target.value)} />
                  <button
                    className={`include-button ${peer.included ? "active" : ""}`}
                    onClick={() => updatePeer(index, "included", String(!peer.included))}
                    type="button"
                  >
                    {peer.included ? "In" : "Out"}
                  </button>
                  <button className="icon-button" onClick={() => removePeer(index)} type="button" aria-label={`Remove ${peer.name}`}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
          )}

          {activeTab === "valuation" && (
          <section className="panel workspace-panel">
            <div className="section-heading horizontal">
              <div>
                <p className="eyebrow">Valuation Range</p>
                <h2>Football field</h2>
              </div>
              <span>Implied share price range: {company.currency} {enterpriseToSharePrice(blendedLow, model).toFixed(2)} - {company.currency} {enterpriseToSharePrice(blendedHigh, model).toFixed(2)}</span>
            </div>
            <div className="football-field">
              {valuationRows.map((row) => {
                const left = Math.max((row.low / valuationScaleMax) * 100, 0);
                const width = Math.max(((row.high - row.low) / valuationScaleMax) * 100, 3);

                return (
                  <div className="football-row" key={row.label}>
                    <span>{row.label}</span>
                    <div className="football-track">
                      <div style={{ left: `${left}%`, width: `${width}%` }} />
                    </div>
                    <strong>
                      {formatMoney(row.low, company.currency)} - {formatMoney(row.high, company.currency)}
                    </strong>
                  </div>
                );
              })}
            </div>
          </section>
          )}

          {activeTab === "valuation" && (
          <section className="panel workspace-panel">
            <div className="section-heading horizontal">
              <div>
                <p className="eyebrow">Sensitivity</p>
                <h2>WACC / terminal growth</h2>
              </div>
              <span>Implied share price</span>
            </div>
            <div className="sensitivity-table">
              <div className="sensitivity-row header">
                <span>WACC / g</span>
                {terminalGrowthColumns.map((growth) => (
                  <span key={growth}>{growth.toFixed(1)}%</span>
                ))}
              </div>
              {sensitivityRows.map((row) => (
                <div className="sensitivity-row" key={row.wacc}>
                  <span>{row.wacc.toFixed(1)}%</span>
                  {row.values.map((value, index) => (
                    <strong key={`${row.wacc}-${index}`}>
                      {company.currency} {value.toFixed(2)}
                    </strong>
                  ))}
                </div>
              ))}
            </div>
          </section>
          )}

          {activeTab === "valuation" && (
          <section className="panel workspace-panel">
            <div className="section-heading horizontal">
              <div>
                <p className="eyebrow">Projection</p>
                <h2>Five-year model</h2>
              </div>
              <span>Scenario: {scenario}</span>
            </div>
            <div className="projection-grid">
              <div className="projection-row header">
                <span>Year</span>
                <span>Growth</span>
                <span>Margin</span>
                <span>Revenue</span>
                <span>EBITDA</span>
                <span>EBIT</span>
                <span>FCF</span>
              </div>
              {dcf.projection.map((row) => (
                <div className="projection-row" key={row.year}>
                  <span>Y{row.year}</span>
                  <strong>{row.revenueGrowth.toFixed(1)}%</strong>
                  <strong>{row.ebitdaMargin.toFixed(1)}%</strong>
                  <strong>{formatMoney(row.revenue, company.currency)}</strong>
                  <strong>{formatMoney(row.ebitda, company.currency)}</strong>
                  <strong>{formatMoney(row.ebit, company.currency)}</strong>
                  <strong>{formatMoney(row.fcf, company.currency)}</strong>
                </div>
              ))}
            </div>
          </section>
          )}

          {activeTab === "memo" && (
          <section className="memo-grid">
            <article className="panel memo-card">
              <div className="section-heading horizontal">
                <div>
                  <p className="eyebrow">Investment Memo</p>
                  <h2>{company.name} initial view</h2>
                </div>
                <button className="ghost-button" disabled={aiLoading} onClick={generateAiMemo} type="button">
                  {aiLoading ? "Generating..." : "Generate AI memo"}
                </button>
              </div>
              <p>
                {aiMemo?.summary ||
                  `${company.name} is a ${company.region}-based ${company.sector} company. Under the ${scenario} case, revenue is projected to reach ${formatMoney(nextRevenue, company.currency)} next year, with EBITDA margin at ${dcf.projection[0]?.ebitdaMargin.toFixed(1)}%. The blended valuation triangulates to ${formatMoney(blendedEnterpriseValue, company.currency)} EV.`}
              </p>
              {aiMemo?.recommendation && (
                <div className="recommendation-pill">
                  <span>Recommendation</span>
                  <strong>{aiMemo.recommendation}</strong>
                </div>
              )}
              <div className="memo-columns">
                <div>
                  <strong>Investment thesis</strong>
                  <ul>
                    {(aiMemo?.thesis || [
                      `Attractive sector exposure in ${company.sector}.`,
                      "Model implies scalable EBITDA profile.",
                      "Peer group supports multiple-based valuation checks.",
                    ]).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Key risks</strong>
                  <ul>
                    {(aiMemo?.risks || [
                      `Terminal value sensitivity is ${terminalShare.toFixed(0)}% of DCF EV.`,
                      "Growth assumptions drive most of the upside case.",
                      "Peer multiples require validation against business model quality.",
                    ]).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
            <article className="panel deck-card">
              <p className="eyebrow">Pitch Deck Outline</p>
              <h2>IC-style slide flow</h2>
              <ol>
                {(aiMemo?.deckOutline || [
                  "Company profile and transaction context",
                  "Financial model summary and key assumptions",
                  "Peer group and trading comps output",
                  "DCF, sensitivity and football field valuation",
                  "Investment thesis, risks and recommendation",
                ]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </article>
          </section>
          )}
        </div>

        <aside className="output-rail">
          <section className="panel output-card">
            <p className="eyebrow">Live Output</p>
            <h2>{company.name}</h2>
            <div className="output-list">
              <div>
                <span>Blended EV</span>
                <strong>{formatMoney(blendedEnterpriseValue, company.currency)}</strong>
              </div>
              <div>
                <span>Blended equity value</span>
                <strong>{formatMoney(blendedEquityValue, company.currency)}</strong>
              </div>
              <div>
                <span>Implied share price</span>
                <strong>
                  {company.currency} {blendedSharePrice.toFixed(2)}
                </strong>
              </div>
              <div>
                <span>DCF EV</span>
                <strong>{formatMoney(dcf.enterpriseValue, company.currency)}</strong>
              </div>
              <div>
                <span>Peer EV/EBITDA</span>
                <strong>{formatMultiple(medianEvEbitda)}</strong>
              </div>
            </div>
          </section>

          <section className="panel next-actions">
            <p className="eyebrow">Next steps</p>
            <ul>
              <li>Validate peer group business model fit.</li>
              <li>Add yearly revenue and margin assumptions.</li>
              <li>Build sensitivity table for WACC and terminal growth.</li>
              <li>Export memo into a pitch deck slide.</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
