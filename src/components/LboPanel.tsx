"use client";
import { Fragment, useState, useMemo } from "react";
import { calculateLbo, lboSensitivity, type LboInputs } from "@/lib/lbo";
import type { CompanyInput } from "@/lib/types";

export function LboPanel({ company }: { company: CompanyInput }) {
  const [inp, setInp] = useState<LboInputs>({
    entryEv: 48000,
    entryMultiple: 14,
    exitMultiple: 13,
    equityPct: 35,
    revenueGrowth: 11,
    marginExpansion: 2,
    holdYears: 5,
    debtRate: 7.5,
  });
  const set = (k: keyof LboInputs, v: number) => setInp((s) => ({ ...s, [k]: v }));

  const out = useMemo(() => calculateLbo(inp), [inp]);
  const sens = useMemo(() => lboSensitivity(inp), [inp]);
  const irrMin = Math.min(...sens.grid.flat());
  const irrMax = Math.max(...sens.grid.flat());

  const bridge = [
    { label: "Entry equity",  v: out.bridge.entryEquity,        type: "start" as const },
    { label: "EBITDA growth", v: out.bridge.ebitdaGrowth,       type: "positive" as const },
    { label: "Multiple Δ",    v: out.bridge.multipleArbitrage,  type: out.bridge.multipleArbitrage >= 0 ? "positive" as const : "negative" as const },
    { label: "Debt paydown",  v: out.bridge.debtPaydown,        type: "positive" as const },
    { label: "Exit equity",   v: out.bridge.exitEquity,         type: "end" as const },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="panel">
        <div className="panel-head">
          <div className="head-title">
            <span className="eyebrow">Workflow · LBO module</span>
            <h2>Leveraged-buyout returns model</h2>
          </div>
          <span className="head-aux">{company.currency}m · {inp.holdYears}-year hold · sponsor view</span>
        </div>

        <div className="lbo-summary">
          <SummaryCard label="Equity IRR" value={`${(out.irr * 100).toFixed(1)}`} unit="%" sub={`over ${inp.holdYears} years`}/>
          <SummaryCard label="Money-on-money" value={out.moic.toFixed(2)} unit="x" sub="cash-on-cash multiple"/>
          <SummaryCard label="Exit equity" value={`${(out.exitEquity / 1000).toFixed(1)}`} unit={`B ${company.currency}`} sub={`vs entry ${(out.equity / 1000).toFixed(1)}B`}/>
          <SummaryCard label="Capital structure" value={inp.equityPct.toString()} unit="% eq" sub={`${100 - inp.equityPct}% debt · ${(out.debt / out.entryEbitda).toFixed(1)}x leverage`}/>
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <div className="head-title">
              <span className="eyebrow">Inputs · entry</span>
              <h2>Transaction assumptions</h2>
            </div>
          </div>
          <div className="panel-body" style={{ display: "grid", gap: 14 }}>
            <Slider label="Entry EV" value={inp.entryEv} onChange={(v) => set("entryEv", v)} min={2000} max={120000} step={500}
                    format={(v) => (v / 1000).toFixed(1) + "B " + company.currency}/>
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
            <span className="head-aux">{company.currency}m</span>
          </div>
          <div className="panel-body">
            <BridgeChart rows={bridge}/>
            <table className="data-table" style={{ marginTop: 8 }}>
              <tbody>
                <tr><td>EBITDA growth contribution</td><td>{Math.round(out.bridge.ebitdaGrowth).toLocaleString()}</td></tr>
                <tr><td>Multiple Δ ({inp.entryMultiple}x → {inp.exitMultiple}x)</td><td>{Math.round(out.bridge.multipleArbitrage).toLocaleString()}</td></tr>
                <tr><td>Cumulative debt paydown</td><td>{Math.round(out.bridge.debtPaydown).toLocaleString()}</td></tr>
                <tr><td>Total value created</td><td><strong>{Math.round(out.exitEquity - out.equity).toLocaleString()}</strong></td></tr>
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
          <span className="head-aux">{company.currency}m</span>
        </div>
        <div className="panel-body tight">
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th><th>Revenue</th><th>EBITDA margin</th><th>EBITDA</th>
                <th>Interest expense</th><th>FCF</th><th>Cash sweep</th><th>Net debt (EOP)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: "var(--panel-soft)", color: "var(--muted)" }}>
                <td>Entry (Y0)</td>
                <td>{Math.round(out.entryRevenue).toLocaleString()}</td>
                <td>{((out.entryEbitda / out.entryRevenue) * 100).toFixed(1)}%</td>
                <td>{Math.round(out.entryEbitda).toLocaleString()}</td>
                <td>—</td><td>—</td><td>—</td>
                <td>{Math.round(out.debt).toLocaleString()}</td>
              </tr>
              {out.years.map((r) => (
                <tr key={r.year}>
                  <td>Year {r.year}</td>
                  <td>{Math.round(r.revenue).toLocaleString()}</td>
                  <td>{r.margin.toFixed(1)}%</td>
                  <td>{Math.round(r.ebitda).toLocaleString()}</td>
                  <td>{Math.round(r.interest).toLocaleString()}</td>
                  <td>{Math.round(r.fcf).toLocaleString()}</td>
                  <td>{Math.round(r.sweep).toLocaleString()}</td>
                  <td>{Math.round(r.debt).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="median">
                <td>Exit (Y{inp.holdYears})</td>
                <td colSpan={2}>EV {Math.round(out.exitEv).toLocaleString()} @ {inp.exitMultiple}x</td>
                <td>{Math.round(out.exitEbitda).toLocaleString()}</td>
                <td colSpan={2}>Net debt {Math.round(out.exitDebt).toLocaleString()}</td>
                <td colSpan={2}>Equity {Math.round(out.exitEquity).toLocaleString()}</td>
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
  const max = Math.max(...rows.filter((r) => r.type === "start" || r.type === "end").map((r) => r.v));
  const colWidth = (W - padL - padR) / rows.length;
  const barW = colWidth * 0.5;

  let running = 0;
  const bars = rows.map((r, i) => {
    if (r.type === "start") {
      running = r.v;
      return { x: padL + i * colWidth, top: 0, h: r.v, label: r.label, v: r.v, color: "var(--blue)" };
    }
    if (r.type === "end") {
      return { x: padL + i * colWidth, top: 0, h: r.v, label: r.label, v: r.v, color: "var(--navy)" };
    }
    const prev = running;
    running += r.v;
    return {
      x: padL + i * colWidth,
      top: Math.min(prev, running),
      h: Math.abs(r.v),
      label: r.label,
      v: r.v,
      color: r.type === "positive" ? "var(--green)" : "var(--red)",
    };
  });

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
              {b.v >= 0 ? "+" : ""}{Math.round(b.v / 100) * 100 >= 1000 ? (b.v / 1000).toFixed(1) + "B" : Math.round(b.v).toLocaleString()}
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
