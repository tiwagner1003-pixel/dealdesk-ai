"use client";
import { Fragment, useMemo } from "react";
import { calculateLbo, lboSensitivity, type LboInputs, type LboAssumptions, type LboOperating } from "@/lib/lbo";
import type { CompanyInput } from "@/lib/types";

export function LboPanel({ company, operating, assumptions, isDefault, entrySource, onChange, onReset }: {
  company: CompanyInput;
  /** Umsatz, EBITDA und Kostenquoten des Falls — nicht im Panel verstellbar. */
  operating: LboOperating;
  assumptions: LboAssumptions;
  /** true, solange der Fall noch mit den abgeleiteten Startwerten rechnet. */
  isDefault: boolean;
  /** Woher der Einstiegsmultiplikator stammt — steht im Erklärsatz über den Kennzahlen. */
  entrySource: "market" | "peers" | "default" | "custom";
  onChange: (a: LboAssumptions) => void;
  onReset: () => void;
}) {
  const inp: LboInputs = useMemo(() => ({ ...operating, ...assumptions }), [operating, assumptions]);
  const set = (k: keyof LboAssumptions, v: number) => onChange({ ...assumptions, [k]: v });

  const out = useMemo(() => calculateLbo(inp), [inp]);
  const sens = useMemo(() => lboSensitivity(inp), [inp]);
  const irrMin = Math.min(...sens.grid.flat());
  const irrMax = Math.max(...sens.grid.flat());
  const ccy = company.currency;
  const bn = (v: number) => (Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + "B" : Math.round(v).toLocaleString("en-US") + "m");

  if (!(operating.entryEbitda > 0)) {
    return (
      <section className="panel">
        <div className="panel-head">
          <div className="head-title">
            <span className="eyebrow">Workflow · Step 05 · LBO</span>
            <h2>Leveraged-buyout returns model</h2>
          </div>
        </div>
        <div className="panel-body">
          <p className="head-aux" style={{ margin: 0 }}>
            An LBO needs positive EBITDA to carry debt. Set revenue and a positive Year-1 EBITDA margin in the Model step first.
          </p>
        </div>
      </section>
    );
  }

  const bridge = [
    { label: "Entry equity",  v: out.bridge.entryEquity,        type: "start" as const },
    { label: "EBITDA growth", v: out.bridge.ebitdaGrowth,       type: out.bridge.ebitdaGrowth >= 0 ? "positive" as const : "negative" as const },
    { label: "Multiple Δ",    v: out.bridge.multipleArbitrage,  type: out.bridge.multipleArbitrage >= 0 ? "positive" as const : "negative" as const },
    { label: "Deleveraging",  v: out.bridge.deleveraging,       type: out.bridge.deleveraging >= 0 ? "positive" as const : "negative" as const },
    { label: "Exit equity",   v: out.bridge.exitEquity,         type: "end" as const },
  ];

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1fr)" }}>
      <section className="panel">
        <div className="panel-head">
          <div className="head-title">
            <span className="eyebrow">Workflow · Step 05 · LBO</span>
            <h2>Leveraged-buyout returns model</h2>
          </div>
          <span className="head-aux">{ccy}m · {inp.holdYears}-year hold · sponsor view</span>
        </div>
        <div className="panel-body" style={{ paddingTop: 0, paddingBottom: 12 }}>
          <span className="head-aux">
            Buy-out of {company.name} at {inp.entryMultiple.toFixed(1)}x LTM EBITDA of {bn(operating.entryEbitda)} {ccy}
            {" "}= entry EV {bn(out.entryEv)} {ccy}
            {entrySource === "market" ? " (current market multiple, before any takeover premium)"
              : entrySource === "peers" ? " (peer median EV/EBITDA)"
              : entrySource === "default" ? " (placeholder 10x — no market or peer multiple)" : " (your assumption)"}.
            {" "}Revenue, EBITDA, D&amp;A, capex, NWC and tax come from the Model step; free cash flow sweeps the debt.
          </span>
        </div>

        <div className="lbo-summary">
          <SummaryCard label="Equity IRR" value={out.irr <= -1 ? "n/m" : `${(out.irr * 100).toFixed(1)}`} unit="%" sub={`over ${inp.holdYears} years`}/>
          <SummaryCard label="Money-on-money" value={out.moic.toFixed(2)} unit="x" sub="cash-on-cash multiple"/>
          <SummaryCard label="Exit equity" value={bn(out.exitEquity)} unit={ccy} sub={`vs entry equity ${bn(out.equity)}`}/>
          <SummaryCard label="Capital structure" value={inp.equityPct.toString()} unit="% eq" sub={`${100 - inp.equityPct}% debt · ${(out.debt / out.entryEbitda).toFixed(1)}x leverage`}/>
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <div className="head-title">
              <span className="eyebrow">Inputs · sponsor</span>
              <h2>Transaction assumptions</h2>
            </div>
            <button className="btn" onClick={onReset} disabled={isDefault} title="Derive entry multiple, growth and margin path from this case again">
              Reset to case
            </button>
          </div>
          <div className="panel-body" style={{ display: "grid", gap: 14, gridTemplateColumns: "minmax(0, 1fr)" }}>
            <Slider label="Entry multiple" value={inp.entryMultiple} onChange={(v) => set("entryMultiple", v)} min={4} max={28} step={0.5} format={(v) => v.toFixed(1) + "x EBITDA"}/>
            <Slider label="Equity / Debt mix" value={inp.equityPct} onChange={(v) => set("equityPct", v)} min={20} max={70} step={1} format={(v) => v + "% equity · " + (100 - v) + "% debt"}/>
            <Slider label="Cost of debt" value={inp.debtRate} onChange={(v) => set("debtRate", v)} min={3} max={14} step={0.25} format={(v) => v.toFixed(2) + "% all-in"}/>
            <Slider label="Hold period" value={inp.holdYears} onChange={(v) => set("holdYears", v)} min={3} max={8} step={1} format={(v) => v + " years"}/>
            <Slider label="Revenue growth" value={inp.revenueGrowth} onChange={(v) => set("revenueGrowth", v)} min={-5} max={30} step={0.5} format={(v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "% p.a."}/>
            <Slider label="Margin expansion" value={inp.marginExpansion} onChange={(v) => set("marginExpansion", v)} min={-5} max={10} step={0.5} format={(v) => (v >= 0 ? "+" : "") + v.toFixed(1) + " pp"}/>
            <Slider label="Exit multiple" value={inp.exitMultiple} onChange={(v) => set("exitMultiple", v)} min={4} max={28} step={0.5} format={(v) => v.toFixed(1) + "x EBITDA"}/>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="head-title">
              <span className="eyebrow">Value creation</span>
              <h2>Bridge: entry equity → exit equity</h2>
            </div>
            <span className="head-aux">{ccy}m</span>
          </div>
          <div className="panel-body">
            <BridgeChart rows={bridge}/>
            <table className="data-table" style={{ marginTop: 8 }}>
              <tbody>
                <tr><td>EBITDA growth contribution</td><td>{Math.round(out.bridge.ebitdaGrowth).toLocaleString("en-US")}</td></tr>
                <tr><td>Multiple Δ ({inp.entryMultiple}x → {inp.exitMultiple}x)</td><td>{Math.round(out.bridge.multipleArbitrage).toLocaleString("en-US")}</td></tr>
                <tr><td>Deleveraging (net debt {Math.round(out.debt).toLocaleString("en-US")} → {Math.round(out.exitNetDebt).toLocaleString("en-US")})</td><td>{Math.round(out.bridge.deleveraging).toLocaleString("en-US")}</td></tr>
                <tr><td>Total value created</td><td><strong>{Math.round(out.exitEquity - out.equity).toLocaleString("en-US")}</strong></td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div className="head-title">
            <span className="eyebrow">Sensitivity</span>
            <h2>IRR · revenue growth × exit multiple</h2>
          </div>
          <span className="head-aux">heat = magnitude · base outlined</span>
        </div>
        <div className="panel-body">
          <div className="lbo-sens">
            <div></div>
            {sens.sensExitM.map((em) => <div key={em} className="lbo-sens-h">{em.toFixed(1)}x</div>)}
            {sens.grid.map((row, i) => (
              <Fragment key={i}>
                <div className="lbo-sens-r">{(sens.sensGrowth[i] >= 0 ? "+" : "") + sens.sensGrowth[i].toFixed(1)}%</div>
                {row.map((v, j) => {
                  const norm = (v - irrMin) / (irrMax - irrMin || 1);
                  const bg = v >= 0
                    ? `color-mix(in oklab, var(--green) ${10 + norm * 60}%, var(--panel))`
                    : `color-mix(in oklab, var(--red) ${30 - norm * 30}%, var(--panel))`;
                  const isBase = sens.sensExitM[j] === inp.exitMultiple && sens.sensGrowth[i] === inp.revenueGrowth;
                  return (
                    <div key={j} className={"lbo-sens-cell" + (isBase ? " base" : "")} style={{ background: bg }}>
                      {(v * 100).toFixed(1)}%
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div className="head-title">
            <span className="eyebrow">Build</span>
            <h2>Hold-period projection</h2>
          </div>
          <span className="head-aux">{ccy}m</span>
        </div>
        <div className="panel-body tight">
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th><th>Revenue</th><th>EBITDA margin</th><th>EBITDA</th>
                <th>Interest</th><th>Tax</th><th>Levered FCF</th><th>Debt repaid</th><th>Debt (EOP)</th><th>Cash (EOP)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: "var(--panel-soft)", color: "var(--muted)" }}>
                <td>Entry (Y0)</td>
                <td>{Math.round(out.entryRevenue).toLocaleString("en-US")}</td>
                <td>{((out.entryEbitda / out.entryRevenue) * 100).toFixed(1)}%</td>
                <td>{Math.round(out.entryEbitda).toLocaleString("en-US")}</td>
                <td>—</td><td>—</td><td>—</td><td>—</td>
                <td>{Math.round(out.debt).toLocaleString("en-US")}</td>
                <td>0</td>
              </tr>
              {out.years.map((r) => (
                <tr key={r.year}>
                  <td>Year {r.year}</td>
                  <td>{Math.round(r.revenue).toLocaleString("en-US")}</td>
                  <td>{r.margin.toFixed(1)}%</td>
                  <td>{Math.round(r.ebitda).toLocaleString("en-US")}</td>
                  <td>{Math.round(r.interest).toLocaleString("en-US")}</td>
                  <td>{Math.round(r.tax).toLocaleString("en-US")}</td>
                  <td>{Math.round(r.fcf).toLocaleString("en-US")}</td>
                  <td>{Math.round(r.repaid).toLocaleString("en-US")}</td>
                  <td>{Math.round(r.debt).toLocaleString("en-US")}</td>
                  <td>{Math.round(r.cash).toLocaleString("en-US")}</td>
                </tr>
              ))}
              <tr className="median">
                <td>Exit (Y{inp.holdYears})</td>
                <td colSpan={2}>EV {Math.round(out.exitEv).toLocaleString("en-US")} @ {inp.exitMultiple}x</td>
                <td>{Math.round(out.exitEbitda).toLocaleString("en-US")}</td>
                <td colSpan={3}>Net debt {Math.round(out.exitNetDebt).toLocaleString("en-US")}</td>
                <td colSpan={3}>Equity {Math.round(out.exitEquity).toLocaleString("en-US")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, unit, sub }: { label: string; value: string; unit: string; sub: string }) {
  return (
    <div className="lbo-summary-card">
      <span className="kpi-label">{label}</span>
      <div className="kpi-value">
        <span className="num-display">{value}</span>
        <span className="unit">{unit}</span>
      </div>
      <span className="kpi-sub">{sub}</span>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; format?: (v: number) => string;
}) {
  return (
    <div className="lbo-slider">
      <div className="lbo-slider-top">
        <span className="lbo-slider-l">{label}</span>
        <span className="lbo-slider-v">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={(e) => onChange(Number(e.target.value))}/>
      <div className="lbo-slider-foot">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

function BridgeChart({ rows }: { rows: { label: string; v: number; type: "start" | "positive" | "negative" | "end" }[] }) {
  const W = 600, H = 220;
  const padL = 30, padR = 10, padT = 20, padB = 50;
  const colWidth = (W - padL - padR) / rows.length;
  const barW = colWidth * 0.5;

  let running = 0;
  const bars = rows.map((r, i) => {
    if (r.type === "start") {
      running = r.v;
      return { x: padL + i * colWidth, top: 0, h: r.v, label: r.label, v: r.v, color: "var(--blue)" };
    }
    if (r.type === "end") {
      return { x: padL + i * colWidth, top: 0, h: Math.max(0, r.v), label: r.label, v: r.v, color: "var(--navy)" };
    }
    const prev = running;
    running += r.v;
    return {
      x: padL + i * colWidth,
      top: Math.max(0, Math.min(prev, running)),
      h: Math.abs(r.v),
      label: r.label,
      v: r.v,
      color: r.type === "positive" ? "var(--green)" : "var(--red)",
    };
  });

  // Skala über alle Balken, nicht nur Anfang und Ende: Ein Zwischenschritt kann darüber hinausragen.
  const max = Math.max(1, ...bars.map((b) => b.top + b.h));
  const scale = (H - padT - padB) / max;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 220, display: "block" }}>
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="var(--line)" strokeWidth="1"/>
      {bars.map((b, i) => {
        const y = H - padB - (b.top + b.h) * scale;
        const h = b.h * scale;
        return (
          <g key={i}>
            <rect x={b.x + (colWidth - barW) / 2} y={y} width={barW} height={h} fill={b.color} rx="2"/>
            <text x={b.x + colWidth / 2} y={y - 6} textAnchor="middle" fontSize="11"
                  fontFamily="var(--font-mono)" fill="var(--text)" fontWeight="500">
              {b.v >= 0 ? "+" : "−"}{Math.abs(b.v) >= 1000 ? (Math.abs(b.v) / 1000).toFixed(1) + "B" : Math.round(Math.abs(b.v)).toLocaleString("en-US")}
            </text>
            <text x={b.x + colWidth / 2} y={H - padB + 16} textAnchor="middle" fontSize="10.5"
                  fill="var(--muted)" fontFamily="var(--font-sans)" fontWeight="500">
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
