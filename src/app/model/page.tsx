"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Chrome } from "@/components/Chrome";
import { Hero } from "@/components/Hero";
import { WorkflowNav } from "@/components/WorkflowNav";
import { SetupPanel } from "@/components/panels/SetupPanel";
import { ModelPanel } from "@/components/panels/ModelPanel";
import { PeersPanel } from "@/components/panels/PeersPanel";
import { ValuationPanel } from "@/components/panels/ValuationPanel";
import { MemoPanel } from "@/components/panels/MemoPanel";
import { RightRail } from "@/components/RightRail";
import { PdfUploadModal, type ExtractedPdfMetrics } from "@/components/PdfUploadModal";
import { CaseCompare } from "@/components/CaseCompare";
import {
  calculateDcf, calculateProjection,
  median, percentile, pct,
  INITIAL_COMPANY, INITIAL_MODEL, INITIAL_FORECAST, INITIAL_PEERS,
} from "@/lib/finance";
import { exportExcelModel, importExcelModel } from "@/lib/exportExcel";
import { exportPowerPointDeck } from "@/lib/exportPpt";
import type {
  CompanyInput, ModelInput, ForecastYear, Peer,
  Scenario, WorkspaceTab, AiMemo, CaseTab, DcfOutput, DataSourceNote, MarketData, StepStatus,
} from "@/lib/types";

const STEP_ORDER: WorkspaceTab[] = ["setup", "model", "peers", "valuation", "memo"];

function computeStepStatuses(
  activeTab: WorkspaceTab,
  visitedTabs: Set<WorkspaceTab>,
  company: CompanyInput,
  model: ModelInput,
  peers: Peer[],
  aiMemo: AiMemo | null,
  sources: DataSourceNote[],
): Record<WorkspaceTab, StepStatus> {
  const hasRealSource = sources.some((s) => s.provider !== "Demo");
  const setupDone = !!(company.name && company.ticker && company.sector && hasRealSource);
  const setupWarn = !!(company.name && company.ticker && company.sector && !hasRealSource);
  const modelDone = model.revenue > 0 && model.wacc > 0;
  const peersDone = peers.filter((p) => p.included).length >= 2;
  const valuationDone = visitedTabs.has("valuation");
  const memoDone = aiMemo !== null;

  const resolve = (tab: WorkspaceTab, done: boolean, warn: boolean): StepStatus => {
    if (tab === activeTab) return "active";
    if (done) return "done";
    if (warn || visitedTabs.has(tab)) return "warn";
    return "pending";
  };

  return {
    setup:     resolve("setup",     setupDone,     setupWarn),
    model:     resolve("model",     modelDone,     false),
    peers:     resolve("peers",     peersDone,     false),
    valuation: resolve("valuation", valuationDone, false),
    memo:      resolve("memo",      memoDone,      false),
  };
}

type DealCase = CaseTab & {
  company: CompanyInput;
  model: ModelInput;
  forecast: ForecastYear[];
  peers: Peer[];
  aiMemo: AiMemo | null;
  sources: DataSourceNote[];
  marketPrice?: number;
  marketData?: MarketData | null;
};

const STORAGE_KEY = "dealdesk-ai-workspace-v1";

const cloneForecast = (rows: ForecastYear[]) => rows.map((r) => ({ ...r }));
const clonePeers = (rows: Peer[]) => rows.map((r) => ({ ...r }));

function makeCase(
  id: string,
  scenario: Scenario,
  company: CompanyInput,
  model: ModelInput,
  forecast = INITIAL_FORECAST,
  peers = INITIAL_PEERS,
  sources?: DataSourceNote[],
  marketPrice?: number,
): DealCase {
  return {
    id,
    name: company.name,
    ticker: company.ticker,
    scenario,
    company: { ...company },
    model: { ...model },
    forecast: cloneForecast(forecast),
    peers: clonePeers(peers),
    aiMemo: null,
    sources: sources || [{
      provider: "Demo",
      label: "Seed values bundled with DealDesk AI",
      confidence: "low",
      updatedAt: new Date(0).toISOString(),
    }],
    marketPrice,
  };
}

const INITIAL_CASES: DealCase[] = [
  makeCase("adyen", "base", INITIAL_COMPANY, INITIAL_MODEL),
  makeCase("apple", "base", {
    name: "Apple Inc.",
    ticker: "AAPL",
    exchange: "SEC",
    sector: "Technology / Consumer Hardware",
    region: "US",
    currency: "USD",
  }, {
    ...INITIAL_MODEL,
    revenue: 383285,
    depreciationPercent: 3,
    taxRate: 15,
    capexPercent: 3.5,
    nwcPercent: 1,
    netDebt: -61884,
    shares: 14667.688,
    wacc: 7.9,
    terminalGrowth: 3,
    exitMultiple: 28,
  }, [
    { year: 1, revenueGrowth: 4, ebitdaMargin: 34 },
    { year: 2, revenueGrowth: 5, ebitdaMargin: 35 },
    { year: 3, revenueGrowth: 4, ebitdaMargin: 35 },
    { year: 4, revenueGrowth: 3, ebitdaMargin: 36 },
    { year: 5, revenueGrowth: 3, ebitdaMargin: 36 },
  ], [
    { included: true, name: "Microsoft", ticker: "MSFT", revenueGrowth: 13, ebitdaMargin: 52, evRevenue: 16.0, evEbitda: 30.0 },
    { included: true, name: "Alphabet", ticker: "GOOGL", revenueGrowth: 11, ebitdaMargin: 35, evRevenue: 7.0, evEbitda: 20.0 },
    { included: true, name: "Meta", ticker: "META", revenueGrowth: 14, ebitdaMargin: 49, evRevenue: 11.0, evEbitda: 22.0 },
    { included: true, name: "Amazon", ticker: "AMZN", revenueGrowth: 10, ebitdaMargin: 19, evRevenue: 4.0, evEbitda: 23.0 },
    { included: false, name: "NVIDIA", ticker: "NVDA", revenueGrowth: 38, ebitdaMargin: 62, evRevenue: 24.5, evEbitda: 39.5 },
  ], [
    {
      provider: "SEC EDGAR",
      label: "Apple Inc. company facts via SEC XBRL",
      url: "https://www.sec.gov/edgar/browse/?CIK=320193",
      fiscalYear: 2025,
      form: "10-K",
      confidence: "high",
      updatedAt: "2026-05-26T15:02:33.263Z",
    },
    {
      provider: "Demo",
      label: "Forecast, WACC and peer multiples are calibrated model assumptions",
      confidence: "low",
      updatedAt: new Date(0).toISOString(),
    },
    {
      provider: "Manual",
      label: "Spot reference: AAPL $308.82 and market cap about $4.54T as of May 22, 2026",
      confidence: "medium",
      updatedAt: "2026-05-22T20:00:00.000Z",
    },
  ], 308.82),
  makeCase("stripe", "upside", {
    name: "Stripe",
    ticker: "PRIVATE",
    exchange: "Private",
    sector: "Payments / FinTech",
    region: "US",
    currency: "USD",
  }, {
    ...INITIAL_MODEL,
    revenue: 4800,
    netDebt: -5200,
    shares: 120,
    wacc: 10,
    exitMultiple: 18,
  }),
  makeCase("klarna", "downside", {
    name: "Klarna",
    ticker: "KLARN.IPO",
    exchange: "IPO",
    sector: "BNPL / FinTech",
    region: "Europe",
    currency: "SEK",
  }, {
    ...INITIAL_MODEL,
    revenue: 26000,
    depreciationPercent: 3,
    netDebt: 1500,
    shares: 410,
    wacc: 11,
    exitMultiple: 10,
  }, [
    { year: 1, revenueGrowth: 11, ebitdaMargin: 14 },
    { year: 2, revenueGrowth: 10, ebitdaMargin: 17 },
    { year: 3, revenueGrowth: 9, ebitdaMargin: 20 },
    { year: 4, revenueGrowth: 8, ebitdaMargin: 22 },
    { year: 5, revenueGrowth: 7, ebitdaMargin: 24 },
  ]),
];

function compareDataOf(d: DcfOutput, model: ModelInput, forecast: ForecastYear[], sName: Scenario) {
  const proj = calculateProjection(model, forecast, sName);
  const ebitdaMargins = proj.map((p) => p.ebitdaMargin);
  return {
    ev: d.enterpriseValue,
    equity: d.equityValue,
    sharePrice: d.sharePrice,
    year5Revenue: proj[proj.length - 1].revenue,
    year5Fcf: proj[proj.length - 1].fcf,
    avgMargin: ebitdaMargins.reduce((a, b) => a + b, 0) / ebitdaMargins.length,
    terminal: d.terminalShare,
  };
}

function SearchModal({
  open,
  query,
  onQuery,
  cases,
  activeTab,
  onClose,
  onPickCase,
  onPickTab,
}: {
  open: boolean;
  query: string;
  onQuery: (value: string) => void;
  cases: DealCase[];
  activeTab: WorkspaceTab;
  onClose: () => void;
  onPickCase: (id: string) => void;
  onPickTab: (tab: WorkspaceTab) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tabs: { id: WorkspaceTab; label: string }[] = [
    { id: "setup", label: "Case Setup" },
    { id: "model", label: "Model" },
    { id: "peers", label: "Peers" },
    { id: "valuation", label: "Valuation" },
    { id: "memo", label: "Memo" },
  ];
  const q = query.trim().toLowerCase();
  const caseResults = cases.filter((c) =>
    [c.name, c.ticker, c.company.sector, c.company.region].some((v) => v.toLowerCase().includes(q))
  );
  const tabResults = tabs.filter((t) => t.label.toLowerCase().includes(q) || t.id.includes(q));

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>Search workspace</h3>
            <span className="head-aux">Jump to a case or workflow section</span>
          </div>
          <button className="icon-btn" onClick={onClose}>x</button>
        </div>
        <div className="modal-body">
          <div className="input-wrap" style={{ marginBottom: 14 }}>
            <input
              ref={inputRef}
              className="text"
              placeholder="Search company, ticker, sector or memo..."
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && onClose()}
            />
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <span className="eyebrow">Cases</span>
              <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                {(q ? caseResults : cases).map((c) => (
                  <button
                    key={c.id}
                    className="btn"
                    style={{ justifyContent: "space-between" }}
                    onClick={() => { onPickCase(c.id); onClose(); }}
                  >
                    <span>{c.name}</span>
                    <span className="muted num">{c.ticker} - {c.scenario}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="eyebrow">Workflow</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {(q ? tabResults : tabs).map((t) => (
                  <button
                    key={t.id}
                    className={"btn" + (activeTab === t.id ? " primary" : "")}
                    onClick={() => { onPickTab(t.id); onClose(); }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cases, setCases] = useState<DealCase[]>(INITIAL_CASES);
  const searchParams = useSearchParams();
  const [activeCase, setActiveCase] = useState("adyen");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("setup");
  const [pdfOpen, setPdfOpen] = useState(false);
  const [compareOn, setCompareOn] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [secLoading, setSecLoading] = useState(false);
  const [marketLoading, setMarketLoading] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState<Set<WorkspaceTab>>(new Set<WorkspaceTab>(["setup"]));
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  const currentCase = cases.find((c) => c.id === activeCase) || cases[0];
  const company = currentCase.company;
  const model = currentCase.model;
  const forecast = currentCase.forecast;
  const peers = currentCase.peers;
  const scenario = currentCase.scenario;
  const aiMemo = currentCase.aiMemo;
  const sources = currentCase.sources || [];
  const marketData = currentCase.marketData ?? null;

  function updateActiveCase(updater: (c: DealCase) => DealCase) {
    setCases((cs) => cs.map((c) => c.id === activeCase ? updater(c) : c));
  }

  // Import from Analyse module via URL params
  useEffect(() => {
    const name = searchParams.get("name");
    if (!name) return;
    const id = "analyse-" + Date.now();
    const newCase = makeCase(id, "base", {
      name,
      ticker: searchParams.get("ticker") || "TICK",
      exchange: "",
      sector: searchParams.get("sector") || "",
      region: searchParams.get("region") || "",
      currency: searchParams.get("currency") || "EUR",
    }, {
      ...INITIAL_MODEL,
      revenue: parseFloat(searchParams.get("revenue") || "0") || INITIAL_MODEL.revenue,
      netDebt: parseFloat(searchParams.get("netDebt") || "0") || INITIAL_MODEL.netDebt,
      shares: parseFloat(searchParams.get("shares") || "0") || INITIAL_MODEL.shares,
    }, INITIAL_FORECAST.map((f, i) => i === 0
      ? { ...f, ebitdaMargin: parseFloat(searchParams.get("ebitdaMargin") || "0") || f.ebitdaMargin }
      : f
    ), INITIAL_PEERS, [{
      provider: "PDF" as const,
      label: `Imported from Analyse: ${name}`,
      confidence: "medium" as const,
      updatedAt: new Date().toISOString(),
    }]);
    setCases((cs) => [newCase, ...cs]);
    setActiveCase(id);
    setStatusMessage(`Case für ${name} aus Analyse importiert. Bitte Annahmen prüfen.`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setScenario(s: Scenario) {
    updateActiveCase((c) => ({ ...c, scenario: s }));
  }

  function goToTab(tab: WorkspaceTab) {
    setActiveTab(tab);
    setVisitedTabs((prev) => new Set([...prev, tab]));
  }

  function goNextTab() {
    const idx = STEP_ORDER.indexOf(activeTab);
    if (idx < STEP_ORDER.length - 1) goToTab(STEP_ORDER[idx + 1]);
  }

  const stepStatuses = useMemo(
    () => computeStepStatuses(activeTab, visitedTabs, company, model, peers, aiMemo, sources),
    [activeTab, visitedTabs, company, model, peers, aiMemo, sources],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        cases?: DealCase[];
        activeCase?: string;
        theme?: "light" | "dark";
        savedAt?: string;
      };
      if (parsed.cases?.length) {
        setCases(parsed.cases);
        setActiveCase(parsed.activeCase || parsed.cases[0].id);
      }
      if (parsed.theme === "dark" || parsed.theme === "light") setTheme(parsed.theme);
      if (parsed.savedAt) setSavedAt(new Date(parsed.savedAt));
    } catch {
      setStatusMessage("Saved workspace could not be loaded.");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onCompany = (k: keyof CompanyInput, v: string) =>
    updateActiveCase((c) => {
      const companyNext = { ...c.company, [k]: v };
      return {
        ...c,
        company: companyNext,
        name: k === "name" ? v : c.name,
        ticker: k === "ticker" ? v : c.ticker,
      };
    });
  const onModel = (k: keyof ModelInput, v: string) =>
    updateActiveCase((c) => ({ ...c, model: { ...c.model, [k]: Number(v) || 0 } }));
  const onForecast = (i: number, k: keyof ForecastYear, v: string) =>
    updateActiveCase((c) => ({
      ...c,
      forecast: c.forecast.map((r, j) => j === i ? { ...r, [k]: Number(v) || 0 } : r),
    }));
  const onPeer = (i: number, k: keyof Peer, v: string) =>
    updateActiveCase((c) => ({
      ...c,
      peers: c.peers.map((p, j) => {
        if (j !== i) return p;
        if (k === "included") return { ...p, included: v === "true" };
        if (k === "name" || k === "ticker") return { ...p, [k]: v };
        return { ...p, [k]: Number(v) || 0 };
      }),
    }));
  const addPeer = () => updateActiveCase((c) => ({
    ...c,
    peers: [
      ...c.peers,
      { included: true, name: "New Peer", ticker: "TICK", revenueGrowth: 8, ebitdaMargin: 25, evRevenue: 3, evEbitda: 10 },
    ],
  }));
  const removePeer = (i: number) =>
    updateActiveCase((c) => ({ ...c, peers: c.peers.filter((_, j) => j !== i) }));

  const includedPeers = useMemo(() => peers.filter((p) => p.included), [peers]);
  const valuationPeers = includedPeers.length ? includedPeers : peers;

  const dcf = useMemo(() => calculateDcf(model, forecast, scenario), [model, forecast, scenario]);
  const dcfDown = useMemo(() => calculateDcf(model, forecast, "downside"), [model, forecast]);
  const dcfBase = useMemo(() => calculateDcf(model, forecast, "base"), [model, forecast]);
  const dcfUp = useMemo(() => calculateDcf(model, forecast, "upside"), [model, forecast]);

  const medianEvRevenue = useMemo(() => median(valuationPeers.map((p) => p.evRevenue)), [valuationPeers]);
  const medianEvEbitda = useMemo(() => median(valuationPeers.map((p) => p.evEbitda)), [valuationPeers]);
  const evRevLow = percentile(valuationPeers.map((p) => p.evRevenue), 0.25);
  const evRevHigh = percentile(valuationPeers.map((p) => p.evRevenue), 0.75);
  const evEbitdaLow = percentile(valuationPeers.map((p) => p.evEbitda), 0.25);
  const evEbitdaHigh = percentile(valuationPeers.map((p) => p.evEbitda), 0.75);

  const currentEbitda = model.revenue * pct(forecast[0]?.ebitdaMargin || 0);
  const compsEvRevenue = model.revenue * medianEvRevenue;
  const compsEvEbitda = currentEbitda * medianEvEbitda;
  const compsRevLow = model.revenue * evRevLow;
  const compsRevHigh = model.revenue * evRevHigh;
  const compsEbitdaLow = currentEbitda * evEbitdaLow;
  const compsEbitdaHigh = currentEbitda * evEbitdaHigh;

  const blendedEv = (dcf.enterpriseValue + compsEvRevenue + compsEvEbitda) / 3;
  const blendedEquity = blendedEv - model.netDebt;
  const blendedShare = model.shares > 0 ? blendedEquity / model.shares : 0;

  const blendedLow = (dcfDown.enterpriseValue + compsRevLow + compsEbitdaLow) / 3;
  const blendedHigh = (dcfUp.enterpriseValue + compsRevHigh + compsEbitdaHigh) / 3;
  const dcfRange = [dcfDown.enterpriseValue, dcfBase.enterpriseValue, dcfUp.enterpriseValue];
  const ffRows = [
    { label: "DCF", low: Math.min(...dcfRange), high: Math.max(...dcfRange) },
    { label: "EV / Revenue", low: compsRevLow, high: compsRevHigh },
    { label: "EV / EBITDA", low: compsEbitdaLow, high: compsEbitdaHigh },
    { label: "Blended range", low: blendedLow, high: blendedHigh },
  ];
  const ffScaleMax = Math.ceil(Math.max(...ffRows.map((r) => r.high), 1) / 10000) * 10000;

  const sensCols = [model.terminalGrowth - 0.5, model.terminalGrowth, model.terminalGrowth + 0.5];
  const sensRows = [model.wacc - 1, model.wacc, model.wacc + 1].map((wacc) => ({
    wacc,
    values: sensCols.map((tg) =>
      calculateDcf({ ...model, wacc, terminalGrowth: tg }, forecast, scenario).sharePrice
    ),
  }));

  const spot = currentCase.marketPrice || (model.shares > 0 && currentCase.id === "adyen" ? 360.38 : blendedShare * 0.88);
  const kpis = {
    sharePrice: blendedShare,
    spot,
    upside: spot > 0 ? ((blendedShare / spot) - 1) * 100 : 0,
    ev: blendedEv,
    equity: blendedEquity,
    dcfEv: dcf.enterpriseValue,
    compsEv: (compsEvRevenue + compsEvEbitda) / 2,
    terminal: dcf.terminalShare,
    evEbitda: medianEvEbitda,
    evRevenue: medianEvRevenue,
  };

  const exportCtx = {
    company, model, forecast, peers, scenario, dcf,
    compsEvRevenue, compsEvEbitda,
    blendedEnterpriseValue: blendedEv,
    blendedEquityValue: blendedEquity,
    blendedSharePrice: blendedShare,
    medianEvRevenue, medianEvEbitda,
    terminalShare: dcf.terminalShare,
    valuationRows: ffRows,
    valuationScaleMax: ffScaleMax,
    sensitivityRows: sensRows,
    terminalGrowthColumns: sensCols,
    includedPeers,
  };

  function saveWorkspace() {
    const stamp = new Date();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cases,
      activeCase,
      theme,
      savedAt: stamp.toISOString(),
    }));
    setSavedAt(stamp);
    setStatusMessage("Workspace saved locally.");
  }

  async function generateMemo() {
    setAiLoading(true);
    setStatusMessage("");
    try {
      const res = await fetch("/api/ai-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company, model, forecast, peers, scenario,
          outputs: {
            dcfEnterpriseValue: dcf.enterpriseValue,
            dcfEquityValue: dcf.equityValue,
            blendedEnterpriseValue: blendedEv,
            blendedEquityValue: blendedEquity,
            blendedSharePrice: blendedShare,
            medianEvRevenue, medianEvEbitda,
            terminalShare: dcf.terminalShare,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI memo failed.");
      updateActiveCase((c) => ({ ...c, aiMemo: data.memo }));
      setActiveTab("memo");
    } catch (e) {
      setStatusMessage(e instanceof Error ? e.message : "AI memo failed.");
    } finally {
      setAiLoading(false);
    }
  }

  async function fetchSecData() {
    const ticker = company.ticker.trim();
    if (!ticker) {
      setStatusMessage("Enter a US-listed ticker first.");
      return;
    }
    setSecLoading(true);
    setStatusMessage("");
    try {
      const res = await fetch(`/api/edgar-company-facts?ticker=${encodeURIComponent(ticker)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "SEC import failed.");
      updateActiveCase((c) => {
        const companyNext = {
          ...c.company,
          ...Object.fromEntries(Object.entries(data.company || {}).filter(([, value]) => value != null && value !== "")),
          sector: c.company.sector,
        };
        const modelPatch = Object.fromEntries(
          Object.entries(data.model || {}).filter(([, value]) => typeof value === "number" && Number.isFinite(value))
        ) as Partial<ModelInput>;
        return {
          ...c,
          company: companyNext,
          name: companyNext.name,
          ticker: companyNext.ticker,
          model: { ...c.model, ...modelPatch },
          sources: [data.source as DataSourceNote, ...(c.sources || [])].filter(Boolean).slice(0, 8),
        };
      });
      setStatusMessage(`SEC data imported for ${data.company?.ticker || ticker}. Review the model assumptions before using the valuation.`);
      setActiveTab("model");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "SEC import failed.");
    } finally {
      setSecLoading(false);
    }
  }

  async function fetchMarketData() {
    const ticker = company.ticker.trim();
    if (!ticker || ticker === "PRIVATE") {
      setStatusMessage("Market data is only available for publicly listed tickers.");
      return;
    }
    setMarketLoading(true);
    setStatusMessage("");
    try {
      const ebitda = model.revenue * (forecast[0]?.ebitdaMargin || 0) / 100;
      const params = new URLSearchParams({
        ticker,
        shares: String(model.shares),
        netDebt: String(model.netDebt),
        revenue: String(model.revenue),
        ebitda: String(ebitda),
      });
      const res = await fetch(`/api/market-data?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Market data fetch failed.");
      updateActiveCase((c) => ({
        ...c,
        marketData: data as MarketData,
        marketPrice: (data as MarketData).price,
        sources: [{
          provider: "Manual" as const,
          label: `Live price ${data.currency} ${(data as MarketData).price.toFixed(2)} via Yahoo Finance`,
          confidence: "medium" as const,
          updatedAt: (data as MarketData).fetchedAt,
        }, ...(c.sources || [])].slice(0, 8),
      }));
      setStatusMessage(`Market data loaded for ${(data as MarketData).name}: ${(data as MarketData).currency} ${(data as MarketData).price.toFixed(2)}.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Market data fetch failed.");
    } finally {
      setMarketLoading(false);
    }
  }

  function applyExtractedPdf(metrics: ExtractedPdfMetrics) {
    updateActiveCase((c) => ({
      ...c,
      model: {
        ...c.model,
        revenue: metrics.revenue,
        depreciationPercent: metrics.depreciationPercent,
        taxRate: metrics.taxRate,
        capexPercent: metrics.capexPercent,
        netDebt: metrics.netDebt,
        shares: metrics.shares,
      },
      forecast: c.forecast.map((row, index) => index === 0
        ? { ...row, ebitdaMargin: metrics.ebitdaMargin }
        : row),
      sources: [{
        provider: "PDF",
        label: `${metrics.fileName} demo extraction`,
        confidence: "medium",
        updatedAt: new Date().toISOString(),
      } satisfies DataSourceNote, ...(c.sources || [])].slice(0, 8),
    }));
    setStatusMessage(`PDF metrics from ${metrics.fileName} applied to the active model.`);
  }

  async function onImportExcel(file: File) {
    try {
      const result = await importExcelModel(file);
      updateActiveCase((c) => {
        const companyNext = result.company.name ? { ...c.company, ...result.company } : c.company;
        return {
          ...c,
          company: companyNext,
          name: companyNext.name,
          ticker: companyNext.ticker,
          model: Object.keys(result.model).length > 0 ? { ...c.model, ...result.model } as ModelInput : c.model,
          forecast: result.forecast || c.forecast,
          peers: result.peers || c.peers,
          sources: [{
            provider: "Excel",
            label: file.name,
            confidence: "medium",
            updatedAt: new Date().toISOString(),
          } satisfies DataSourceNote, ...(c.sources || [])].slice(0, 8),
        };
      });
      setStatusMessage(`Excel model imported from ${file.name}.`);
    } catch {
      setStatusMessage("Excel import failed.");
    }
  }

  const savedLabel = savedAt
    ? `Saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Save";

  return (
    <div className="app">
      <Chrome
        cases={cases}
        activeCase={activeCase}
        onActivate={setActiveCase}
        onClose={(id) => {
          setCases((cs) => {
            if (cs.length === 1) {
              setStatusMessage("Keep at least one case open.");
              return cs;
            }
            const next = cs.filter((c) => c.id !== id);
            if (id === activeCase) setActiveCase(next[0].id);
            return next;
          });
        }}
        onAdd={() => {
          const id = "case-" + Date.now();
          const next = makeCase(id, "base", {
            ...INITIAL_COMPANY,
            name: "New case",
            ticker: "TICK",
          }, INITIAL_MODEL);
          setCases((cs) => [...cs, next]);
          setActiveCase(id);
          setActiveTab("setup");
        }}
        theme={theme}
        onTheme={() => setTheme((t) => t === "dark" ? "light" : "dark")}
        onUpload={() => setPdfOpen(true)}
        onImportExcel={() => excelInputRef.current?.click()}
        onCompare={() => setCompareOn((v) => !v)}
        compareOn={compareOn}
        onSearch={() => setSearchOpen(true)}
        onSave={saveWorkspace}
        savedLabel={savedLabel}
        notificationsOpen={notificationsOpen}
        onNotifications={() => setNotificationsOpen((v) => !v)}
      />

      <div className="shell">
        <main className="workspace">
          {statusMessage && (
            <div style={{
              background: "var(--blue-soft)",
              border: "1px solid var(--blue)",
              borderRadius: 6,
              padding: "10px 14px",
              fontSize: 12.5,
              color: "var(--blue)",
              fontWeight: 500,
            }}>{statusMessage}</div>
          )}

          <Hero
            company={company}
            scenario={scenario}
            onScenario={setScenario}
            kpis={kpis}
            onGenerateMemo={generateMemo}
            onExportPpt={() => exportPowerPointDeck({ ...exportCtx, aiMemo })}
            onExportXls={() => exportExcelModel(exportCtx)}
          />

          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportExcel(f);
              e.currentTarget.value = "";
            }}
          />

          <WorkflowNav
            active={activeTab}
            onSet={goToTab}
            onCompare={() => setCompareOn((v) => !v)}
            compareOn={compareOn}
            statuses={stepStatuses}
          />

          {compareOn && (
            <CaseCompare
              onClose={() => setCompareOn(false)}
              downside={compareDataOf(dcfDown, model, forecast, "downside")}
              base={compareDataOf(dcfBase, model, forecast, "base")}
              upside={compareDataOf(dcfUp, model, forecast, "upside")}
              ccy={company.currency}
              onPickScenario={(s) => { setScenario(s); setCompareOn(false); }}
            />
          )}

          {activeTab === "setup" && (
            <SetupPanel
              company={company} onCompany={onCompany}
              scenario={scenario} onScenario={setScenario}
              sources={sources}
              onFetchSecData={fetchSecData}
              secLoading={secLoading}
              marketData={marketData}
              onFetchMarketData={fetchMarketData}
              marketLoading={marketLoading}
              onNext={goNextTab}
            />
          )}
          {activeTab === "model" && (
            <ModelPanel
              company={company}
              model={model} onModel={onModel}
              forecast={forecast} onForecast={onForecast}
              onNext={goNextTab}
            />
          )}
          {activeTab === "peers" && (
            <PeersPanel
              peers={peers} onPeer={onPeer}
              onAdd={addPeer} onRemove={removePeer}
              median={{
                revenueGrowth: median(valuationPeers.map((p) => p.revenueGrowth)),
                ebitdaMargin: median(valuationPeers.map((p) => p.ebitdaMargin)),
                evRevenue: medianEvRevenue,
                evEbitda: medianEvEbitda,
              }}
              onNext={goNextTab}
            />
          )}
          {activeTab === "valuation" && (
            <ValuationPanel
              ffRows={ffRows} scaleMax={ffScaleMax}
              ccy={company.currency}
              currentEv={dcf.enterpriseValue}
              sensRows={sensRows} sensCols={sensCols}
              baseRow={1} baseCol={1}
              projection={dcf.projection}
              dcf={dcf}
              currentEbitda={currentEbitda}
              medianEvRevenue={medianEvRevenue}
              medianEvEbitda={medianEvEbitda}
              compsEvRevenue={compsEvRevenue}
              compsEvEbitda={compsEvEbitda}
              onNext={goNextTab}
            />
          )}
          {activeTab === "memo" && (
            <MemoPanel
              company={company} scenario={scenario}
              dcf={dcf} terminalShare={dcf.terminalShare}
              blendedEv={blendedEv} blendedShare={blendedShare}
              aiMemo={aiMemo} onGenerate={generateMemo}
              generating={aiLoading} ccy={company.currency}
              onExportPpt={() => exportPowerPointDeck({ ...exportCtx, aiMemo })}
              onExportXls={() => exportExcelModel(exportCtx)}
            />
          )}
        </main>

        <RightRail
          kpis={kpis} company={company} valuationRows={ffRows}
          model={model} forecast={forecast} peers={peers} scenario={scenario}
          activeTab={activeTab}
        />
      </div>

      <PdfUploadModal
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        onApply={applyExtractedPdf}
      />

      <SearchModal
        open={searchOpen}
        query={searchQuery}
        onQuery={setSearchQuery}
        cases={cases}
        activeTab={activeTab}
        onClose={() => setSearchOpen(false)}
        onPickCase={setActiveCase}
        onPickTab={setActiveTab}
      />
    </div>
  );
}

export default function ModelPageWrapper() {
  return (
    <Suspense fallback={<div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: "var(--muted)" }}>Laden…</div>}>
      <Home />
    </Suspense>
  );
}
