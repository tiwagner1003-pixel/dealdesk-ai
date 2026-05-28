"use client";

import type { CompanyInput, Scenario } from "@/lib/types";

type Props = {
  company: CompanyInput;
  onCompany: (field: keyof CompanyInput, value: string) => void;
  scenario: Scenario;
  onScenario: (s: Scenario) => void;
};

export function SetupPanel({ company, onCompany, scenario, onScenario }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div className="head-title">
          <span className="eyebrow">Workflow · Step 01</span>
          <h2>Case setup</h2>
        </div>
        <span className="head-aux">Set investment-case context</span>
      </div>
      <div className="panel-body">
        <div className="field-grid" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
          <div className="field">
            <label>Company</label>
            <div className="input-wrap">
              <input className="text" value={company.name} onChange={(e) => onCompany("name", e.target.value)}/>
            </div>
          </div>
          <div className="field">
            <label>Ticker</label>
            <div className="input-wrap">
              <input value={company.ticker} onChange={(e) => onCompany("ticker", e.target.value.toUpperCase())}/>
            </div>
          </div>
          <div className="field">
            <label>Sector</label>
            <div className="input-wrap">
              <input className="text" value={company.sector} onChange={(e) => onCompany("sector", e.target.value)}/>
            </div>
          </div>
          <div className="field">
            <label>Region</label>
            <div className="input-wrap">
              <input className="text" value={company.region} onChange={(e) => onCompany("region", e.target.value)}/>
            </div>
          </div>
          <div className="field">
            <label>Currency</label>
            <div className="input-wrap">
              <input value={company.currency} onChange={(e) => onCompany("currency", e.target.value.toUpperCase())}/>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 18, padding: 16,
          border: "1px solid var(--line)", borderRadius: 6,
          background: "var(--panel-soft)",
          display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 16, alignItems: "center"
        }}>
          <div>
            <span className="eyebrow">Scenario</span>
            <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 600 }}>Valuation case</h3>
          </div>
          <div className="segmented" style={{ justifySelf: "start" }}>
            {(["downside", "base", "upside"] as Scenario[]).map((s) => (
              <button key={s} className={scenario === s ? "active" : ""} onClick={() => onScenario(s)}>
                {s}
              </button>
            ))}
          </div>
          <span className="head-aux">Affects growth & margin overlay</span>
        </div>
      </div>
    </section>
  );
}
