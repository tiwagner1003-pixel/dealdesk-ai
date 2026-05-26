export type CompanyInput = {
  name: string;
  ticker: string;
  exchange?: string;
  sector: string;
  region: string;
  currency: string;
};

export type DataSourceNote = {
  provider: "Demo" | "Manual" | "Excel" | "PDF" | "SEC EDGAR";
  label: string;
  url?: string;
  fiscalYear?: number;
  form?: string;
  confidence: "high" | "medium" | "low";
  updatedAt: string;
};

export type ModelInput = {
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

export type Peer = {
  included: boolean;
  name: string;
  ticker: string;
  revenueGrowth: number;
  ebitdaMargin: number;
  evRevenue: number;
  evEbitda: number;
};

export type ForecastYear = {
  year: number;
  revenueGrowth: number;
  ebitdaMargin: number;
};

export type Scenario = "base" | "upside" | "downside";

export type WorkspaceTab = "setup" | "model" | "peers" | "valuation" | "memo";

export type StepStatus = "done" | "active" | "warn" | "pending";

export type AiMemo = {
  recommendation: string;
  summary: string;
  thesis: string[];
  risks: string[];
  deckOutline: string[];
  source: "claude" | "fallback";
};

export type MarketData = {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  marketCap: number | null;
  impliedEv: number | null;
  impliedEvEbitda: number | null;
  impliedEvRevenue: number | null;
  week52High: number;
  week52Low: number;
  dayHigh: number;
  dayLow: number;
  priceVs52wHigh: number;
  fetchedAt: string;
};

export type CaseTab = {
  id: string;
  name: string;
  ticker: string;
  scenario: Scenario;
};

export type ChatMessage = {
  role: "user" | "assistant";
  body: string;
  bullets?: string[];
  citations?: string[];
};

export type ProjectionYear = {
  year: number;
  revenueGrowth: number;
  ebitdaMargin: number;
  revenue: number;
  ebitda: number;
  ebit: number;
  fcf: number;
};

export type DcfOutput = {
  projection: ProjectionYear[];
  enterpriseValue: number;
  gordonEnterpriseValue: number;
  exitEnterpriseValue: number;
  equityValue: number;
  sharePrice: number;
  pvTerminal: number;
  terminalShare: number;
};
