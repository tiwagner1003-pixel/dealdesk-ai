"use client";

import { Ico } from "./icons";
import type { CompanyInput, Scenario } from "@/lib/types";

type Kpis = {
  sharePrice: number;
  spot: number;
  upside: number;
  ev: number;
  equity: number;
  dcfEv: number;
  compsEv: number;
  terminal: number;
  evEbitda: number;
  evRevenue: number;
};

type Props = {
  company: CompanyInput;
  scenario: Scenario;
  onScenario: (s: Scenario) => void;
  kpis: Kpis;
  onGenerateMemo: () => void;
  onExportPpt: () => void;
  onExportXls: () => void;
};

export function Hero({
  company, scenario, onScenario, kpis,
  onGenerateMemo, onExportPpt, onExportXls,
}: Props) {
  return (
    <section className="hero">
      <div className="hero-left">
        <div className="hero-meta">
          <span className="tag blue">{company.sector}</span>
          <span className="tag">{company.region}</span>
          <span className="tag">{company.ticker} · {company.exchange || "AMS"}</span>
          <span className="tag">{company.currency}</span>
        </div>

        <div>
          <div className="hero-company">
            <h1>{company.name}</h1>
          </div>
          <p className="hero-summary">
            Five-year valuation case across DCF, trading comps and blended triangulation.
            AI memo synthesises model output with peer-set commentary and a structured risk register.
          </p>
        </div>

        <div className="scenario-row">
          <span className="scenario-label">Scenario</span>
          <div className="segmented">
            {(["downside", "base", "upside"] as Scenario[]).map((s) => (
              <button key={s} className={scenario === s ? "active" : ""} onClick={() => onScenario(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-cta-row">
          <button className="btn primary" onClick={onGenerateMemo}>
            <Ico.sparkle/>
            Generate AI memo
          </button>
          <button className="btn" onClick={onExportPpt}>
            <Ico.download/>
            PowerPoint
          </button>
          <button className="btn" onClick={onExportXls}>
            <Ico.download/>
            Excel model
          </button>
          <span
            className="ml-auto eyebrow muted"
            style={{ fontFamily: "var(--font-mono)", textTransform: "none", letterSpacing: 0 }}
          >
            Last edit <span className="tabular">14:08 CET</span> by you
          </span>
        </div>
      </div>

      <div className="hero-right">
        <div className="kpi-stack">
          <div className="kpi-card-hero">
            <span className="kpi-label">Implied share price (blended)</span>
            <div className="kpi-value">
              <span className="num-display">{kpis.sharePrice.toFixed(2)}</span>
              <span className="unit">{company.currency}</span>
            </div>
            <div className="kpi-sub">
              <span>vs spot <span className="tabular">{kpis.spot.toFixed(2)}</span></span>
              <span style={{ color: "var(--muted-soft)" }}>·</span>
              <span className={"delta " + (kpis.upside >= 0 ? "up" : "down")}>
                {kpis.upside >= 0 ? "▲" : "▼"} {Math.abs(kpis.upside).toFixed(1)}% upside
              </span>
            </div>
          </div>

          <div className="kpi-card-hero">
            <span className="kpi-label">Blended enterprise value</span>
            <div className="kpi-value">
              <span className="num-display">{(kpis.ev / 1000).toFixed(1)}</span>
              <span className="unit">B {company.currency}</span>
            </div>
            <div className="kpi-sub">
              <span>EV/EBITDA <span className="num">{kpis.evEbitda.toFixed(1)}x</span></span>
              <span>·</span>
              <span>EV/Rev <span className="num">{kpis.evRevenue.toFixed(1)}x</span></span>
            </div>
          </div>
        </div>

        <div className="kpi-mini-row">
          <div className="kpi-mini">
            <span className="label">DCF EV</span>
            <span className="val">{(kpis.dcfEv / 1000).toFixed(1)}B</span>
          </div>
          <div className="kpi-mini">
            <span className="label">Comps EV</span>
            <span className="val">{(kpis.compsEv / 1000).toFixed(1)}B</span>
          </div>
          <div className="kpi-mini">
            <span className="label">Terminal %</span>
            <span className="val">{kpis.terminal.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
