"use client";

import type { CompanyInput, ModelInput, ForecastYear } from "@/lib/types";

type Props = {
  company: CompanyInput;
  model: ModelInput;
  onModel: (field: keyof ModelInput, value: string) => void;
  forecast: ForecastYear[];
  onForecast: (index: number, field: keyof ForecastYear, value: string) => void;
  onNext: () => void;
};

export function ModelPanel({ company, model, onModel, forecast, onForecast, onNext }: Props) {
  const inputs: { k: keyof ModelInput; label: string; suffix: string }[] = [
    { k: "revenue",             label: "Revenue",         suffix: company.currency + "m" },
    { k: "depreciationPercent", label: "D&A / rev",       suffix: "%" },
    { k: "taxRate",             label: "Tax rate",        suffix: "%" },
    { k: "capexPercent",        label: "Capex / rev",     suffix: "%" },
    { k: "nwcPercent",          label: "ΔNWC / rev",      suffix: "%" },
    { k: "netDebt",             label: "Net debt",        suffix: company.currency + "m" },
    { k: "shares",              label: "Shares out.",     suffix: "m" },
    { k: "wacc",                label: "WACC",            suffix: "%" },
    { k: "terminalGrowth",      label: "Terminal growth", suffix: "%" },
    { k: "exitMultiple",        label: "Exit multiple",   suffix: "x" },
  ];

  return (
    <section className="panel">
      <div className="panel-head">
        <div className="head-title">
          <span className="eyebrow">Workflow · Step 02</span>
          <h2>Operating assumptions</h2>
        </div>
        <span className="head-aux">{company.currency}m unless stated</span>
      </div>
      <div className="panel-body" style={{ display: "grid", gap: 18 }}>
        <div className="field-grid">
          {inputs.map((inp) => (
            <div className="field" key={inp.k}>
              <label>{inp.label}</label>
              <div className="input-wrap">
                <input
                  type="number"
                  value={model[inp.k]}
                  onChange={(e) => onModel(inp.k, e.target.value)}
                />
                <span className="suffix">{inp.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="section-title">
            <div className="left">
              <span className="eyebrow">Five-year forecast</span>
              <h2 style={{ fontSize: 14 }}>Annual revenue growth &amp; EBITDA margin</h2>
            </div>
            <div className="right">{company.currency}m base</div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Revenue growth</th>
                <th>EBITDA margin</th>
                <th>Implied revenue</th>
                <th>Implied EBITDA</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((r, i) => {
                let rev = model.revenue;
                for (let j = 0; j <= i; j++) rev *= 1 + forecast[j].revenueGrowth / 100;
                const ebitda = rev * (r.ebitdaMargin / 100);
                return (
                  <tr key={r.year}>
                    <td>Year {r.year}</td>
                    <td>
                      <input
                        type="number"
                        value={r.revenueGrowth}
                        onChange={(e) => onForecast(i, "revenueGrowth", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={r.ebitdaMargin}
                        onChange={(e) => onForecast(i, "ebitdaMargin", e.target.value)}
                      />
                    </td>
                    <td>{Math.round(rev).toLocaleString()}</td>
                    <td>{Math.round(ebitda).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 0 4px" }}>
        <button className="btn primary" onClick={onNext}>
          Next: Peers →
        </button>
      </div>
    </section>
  );
}
