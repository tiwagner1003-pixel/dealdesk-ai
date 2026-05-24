"use client";

import { useMemo, useState } from "react";

type CompanyInput = {
  name: string;
  ticker: string;
  sector: string;
  region: string;
  currency: string;
};

type ModelInput = {
  revenue: number;
  revenueGrowth: number;
  ebitdaMargin: number;
  depreciationPercent: number;
  taxRate: number;
  capexPercent: number;
  nwcPercent: number;
  netDebt: number;
  shares: number;
  wacc: number;
  terminalGrowth: number;
};

type Peer = {
  name: string;
  ticker: string;
  revenueGrowth: number;
  ebitdaMargin: number;
  evRevenue: number;
  evEbitda: number;
};

type Scenario = "base" | "upside" | "downside";
type WorkspaceTab = "setup" | "model" | "peers" | "valuation" | "memo";

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
  revenueGrowth: 14,
  ebitdaMargin: 48,
  depreciationPercent: 4,
  taxRate: 25,
  capexPercent: 5,
  nwcPercent: 2,
  netDebt: -2300,
  shares: 31,
  wacc: 9,
  terminalGrowth: 3,
};

const INITIAL_PEERS: Peer[] = [
  {
    name: "PayPal",
    ticker: "PYPL",
    revenueGrowth: 7,
    ebitdaMargin: 24,
    evRevenue: 2.4,
    evEbitda: 9.8,
  },
  {
    name: "Block",
    ticker: "SQ",
    revenueGrowth: 11,
    ebitdaMargin: 18,
    evRevenue: 1.8,
    evEbitda: 12.6,
  },
  {
    name: "Wise",
    ticker: "WISE.L",
    revenueGrowth: 18,
    ebitdaMargin: 32,
    evRevenue: 6.2,
    evEbitda: 19.4,
  },
  {
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

function pct(value: number) {
  return value / 100;
}

function calculateProjection(model: ModelInput, scenario: Scenario) {
  const scenarioGrowth =
    scenario === "upside" ? model.revenueGrowth + 4 : scenario === "downside" ? model.revenueGrowth - 5 : model.revenueGrowth;
  const scenarioMargin =
    scenario === "upside" ? model.ebitdaMargin + 3 : scenario === "downside" ? model.ebitdaMargin - 5 : model.ebitdaMargin;
  const years = [1, 2, 3, 4, 5];
  let revenue = model.revenue;

  return years.map((year) => {
    revenue *= 1 + pct(scenarioGrowth);
    const ebitda = revenue * pct(scenarioMargin);
    const depreciation = revenue * pct(model.depreciationPercent);
    const ebit = ebitda - depreciation;
    const tax = Math.max(0, ebit * pct(model.taxRate));
    const capex = revenue * pct(model.capexPercent);
    const nwc = revenue * pct(model.nwcPercent);
    const fcf = ebit - tax + depreciation - capex - nwc;

    return {
      year,
      revenue,
      ebitda,
      ebit,
      fcf,
    };
  });
}

function calculateDcf(model: ModelInput, scenario: Scenario) {
  const projection = calculateProjection(model, scenario);
  const discountRate = pct(model.wacc);
  const terminalGrowth = pct(model.terminalGrowth);
  const pvFcfs = projection.map((row) => row.fcf / (1 + discountRate) ** row.year);
  const finalFcf = projection[projection.length - 1].fcf;
  const terminalValue = (finalFcf * (1 + terminalGrowth)) / Math.max(discountRate - terminalGrowth, 0.01);
  const pvTerminal = terminalValue / (1 + discountRate) ** projection.length;
  const enterpriseValue = pvFcfs.reduce((sum, value) => sum + value, 0) + pvTerminal;
  const equityValue = enterpriseValue - model.netDebt;
  const sharePrice = model.shares > 0 ? equityValue / model.shares : 0;

  return {
    projection,
    enterpriseValue,
    equityValue,
    sharePrice,
    pvTerminal,
  };
}

export default function Home() {
  const [company, setCompany] = useState(INITIAL_COMPANY);
  const [model, setModel] = useState(INITIAL_MODEL);
  const [peers, setPeers] = useState(INITIAL_PEERS);
  const [scenario, setScenario] = useState<Scenario>("base");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("setup");

  const dcf = useMemo(() => calculateDcf(model, scenario), [model, scenario]);
  const medianEvRevenue = useMemo(() => median(peers.map((peer) => peer.evRevenue)), [peers]);
  const medianEvEbitda = useMemo(() => median(peers.map((peer) => peer.evEbitda)), [peers]);
  const currentEbitda = model.revenue * pct(model.ebitdaMargin);
  const compsEvRevenue = model.revenue * medianEvRevenue;
  const compsEvEbitda = currentEbitda * medianEvEbitda;
  const blendedEnterpriseValue = (dcf.enterpriseValue + compsEvRevenue + compsEvEbitda) / 3;
  const blendedEquityValue = blendedEnterpriseValue - model.netDebt;
  const blendedSharePrice = model.shares > 0 ? blendedEquityValue / model.shares : 0;
  const nextRevenue = dcf.projection[0]?.revenue || model.revenue;
  const terminalShare = dcf.enterpriseValue > 0 ? (dcf.pvTerminal / dcf.enterpriseValue) * 100 : 0;

  function updateCompany(field: keyof CompanyInput, value: string) {
    setCompany((current) => ({ ...current, [field]: value }));
  }

  function updateModel(field: keyof ModelInput, value: string) {
    setModel((current) => ({ ...current, [field]: Number(value) || 0 }));
  }

  function updatePeer(index: number, field: keyof Peer, value: string) {
    setPeers((current) =>
      current.map((peer, peerIndex) =>
        peerIndex === index
          ? {
              ...peer,
              [field]: field === "name" || field === "ticker" ? value : Number(value) || 0,
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
          <button className="ghost-button" type="button">
            Export memo
          </button>
          <button type="button">Create pitch deck</button>
        </div>
      </header>

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
                Revenue growth %
                <input type="number" value={model.revenueGrowth} onChange={(event) => updateModel("revenueGrowth", event.target.value)} />
              </label>
              <label>
                EBITDA margin %
                <input type="number" value={model.ebitdaMargin} onChange={(event) => updateModel("ebitdaMargin", event.target.value)} />
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
                <div className="peer-row" key={`${peer.ticker}-${index}`} role="row">
                  <input value={peer.name} onChange={(event) => updatePeer(index, "name", event.target.value)} />
                  <input value={peer.ticker} onChange={(event) => updatePeer(index, "ticker", event.target.value.toUpperCase())} />
                  <input type="number" value={peer.revenueGrowth} onChange={(event) => updatePeer(index, "revenueGrowth", event.target.value)} />
                  <input type="number" value={peer.ebitdaMargin} onChange={(event) => updatePeer(index, "ebitdaMargin", event.target.value)} />
                  <input type="number" value={peer.evRevenue} onChange={(event) => updatePeer(index, "evRevenue", event.target.value)} />
                  <input type="number" value={peer.evEbitda} onChange={(event) => updatePeer(index, "evEbitda", event.target.value)} />
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
                <p className="eyebrow">Projection</p>
                <h2>Five-year model</h2>
              </div>
              <span>Scenario: {scenario}</span>
            </div>
            <div className="projection-grid">
              <div className="projection-row header">
                <span>Year</span>
                <span>Revenue</span>
                <span>EBITDA</span>
                <span>EBIT</span>
                <span>FCF</span>
              </div>
              {dcf.projection.map((row) => (
                <div className="projection-row" key={row.year}>
                  <span>Y{row.year}</span>
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
              <p className="eyebrow">Investment Memo</p>
              <h2>{company.name} initial view</h2>
              <p>
                {company.name} is a {company.region}-based {company.sector} company. Under the {scenario} case, revenue
                is projected to reach {formatMoney(nextRevenue, company.currency)} next year, with EBITDA margin at
                {" "}
                {scenario === "upside"
                  ? model.ebitdaMargin + 3
                  : scenario === "downside"
                    ? model.ebitdaMargin - 5
                    : model.ebitdaMargin}
                %. The blended valuation triangulates to {formatMoney(blendedEnterpriseValue, company.currency)} EV.
              </p>
              <div className="memo-columns">
                <div>
                  <strong>Investment thesis</strong>
                  <ul>
                    <li>Attractive sector exposure in {company.sector}.</li>
                    <li>Model implies scalable EBITDA profile.</li>
                    <li>Peer group supports multiple-based valuation checks.</li>
                  </ul>
                </div>
                <div>
                  <strong>Key risks</strong>
                  <ul>
                    <li>Terminal value sensitivity is {terminalShare.toFixed(0)}% of DCF EV.</li>
                    <li>Growth assumptions drive most of the upside case.</li>
                    <li>Peer multiples require validation against business model quality.</li>
                  </ul>
                </div>
              </div>
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
