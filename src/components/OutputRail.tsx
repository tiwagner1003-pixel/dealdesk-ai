"use client";

import type { CompanyInput } from "@/lib/types";
import { formatMoney } from "@/lib/format";

type Kpis = {
  sharePrice: number;
  ev: number;
  equity: number;
  dcfEv: number;
  compsEv: number;
  terminal: number;
  evEbitda: number;
  evRevenue: number;
};

type Props = {
  kpis: Kpis;
  company: CompanyInput;
  valuationRows: { label: string; low: number; high: number }[];
};

export function OutputRail({ kpis, company, valuationRows }: Props) {
  const maxHigh = Math.max(...valuationRows.map((r) => r.high), 1);
  return (
    <>
      <div className="rail-section">
        <h3>{company.name}</h3>
        <div className="rail-headline">
          <span className="v">
            <span className="num-display">{kpis.sharePrice.toFixed(2)}</span>
            <span className="unit"> {company.currency}</span>
          </span>
          <span className="l">Blended implied share price</span>
        </div>
        <div className="rail-list">
          <div className="row"><span className="k">Blended EV</span><span className="v">{formatMoney(kpis.ev, company.currency)}</span></div>
          <div className="row"><span className="k">Equity value</span><span className="v">{formatMoney(kpis.equity, company.currency)}</span></div>
          <div className="row"><span className="k">DCF EV</span><span className="v">{formatMoney(kpis.dcfEv, company.currency)}</span></div>
          <div className="row"><span className="k">Comps EV (avg)</span><span className="v">{formatMoney(kpis.compsEv, company.currency)}</span></div>
          <div className="row"><span className="k">EV / EBITDA</span><span className="v">{kpis.evEbitda.toFixed(1)}x</span></div>
          <div className="row"><span className="k">EV / Revenue</span><span className="v">{kpis.evRevenue.toFixed(1)}x</span></div>
          <div className="row"><span className="k">Terminal share</span><span className="v">{kpis.terminal.toFixed(0)}%</span></div>
        </div>
      </div>

      <div className="rail-section">
        <h3>Valuation range</h3>
        {valuationRows.map((r, i) => {
          const w = Math.max(((r.high - r.low) / maxHigh) * 100, 5);
          const l = (r.low / maxHigh) * 100;
          const color = ["var(--blue)", "#4f8afe", "#7eaaf7", "var(--gold)"][i];
          return (
            <div key={r.label} style={{ display: "grid", gap: 4, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                <span className="muted">{r.label}</span>
                <span className="num" style={{ fontWeight: 600 }}>
                  {(r.low / 1000).toFixed(1)} – {(r.high / 1000).toFixed(1)}B
                </span>
              </div>
              <div style={{ height: 6, background: "var(--panel-inset)", borderRadius: 3, position: "relative" }}>
                <div style={{
                  position: "absolute", left: l + "%", width: w + "%",
                  height: "100%", background: color, borderRadius: 3,
                }}/>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rail-section">
        <h3>Audit trail</h3>
        <div style={{ display: "grid", gap: 10, fontSize: 12.5 }}>
          {[
            ["WACC adjusted", "9.0% → 9.5%", "14:08"],
            ["Peer added", "Worldline (WLN.PA)", "13:55"],
            ["Scenario", "base → upside", "13:42"],
            ["PDF imported", "Q3-2025 results", "12:30"],
          ].map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 4 }}>
              <span style={{ color: "var(--text)", fontWeight: 500 }}>{row[0]}</span>
              <span className="num muted" style={{ fontSize: 11 }}>{row[2]}</span>
              <span className="muted num" style={{ fontSize: 11.5, gridColumn: "1 / -1" }}>{row[1]}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
