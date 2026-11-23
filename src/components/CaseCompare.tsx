"use client";

import { Ico } from "./icons";
import type { Scenario } from "@/lib/types";

type CaseData = {
  ev: number;
  equity: number;
  sharePrice: number;
  year5Revenue: number;
  year5Fcf: number;
  avgMargin: number;
  terminal: number;
};

type Props = {
  onClose: () => void;
  downside: CaseData;
  base: CaseData;
  upside: CaseData;
  ccy: string;
  onPickScenario: (s: Scenario) => void;
};

export function CaseCompare({ onClose, downside, base, upside, ccy, onPickScenario }: Props) {
  const maxEv = Math.max(downside.ev, base.ev, upside.ev);
  const cols: { id: Scenario; label: string; data: CaseData }[] = [
    { id: "downside", label: "Downside", data: downside },
    { id: "base",     label: "Base",     data: base },
    { id: "upside",   label: "Upside",   data: upside },
  ];

  return (
    <section className="panel" style={{ marginBottom: 0 }}>
      <div className="panel-head">
        <div className="head-title">
          <span className="eyebrow">Case compare · D · B · U</span>
          <h2>Scenario triangulation</h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="head-aux" style={{ alignSelf: "center", marginRight: 8 }}>
            Click a case to load it
          </span>
          <button className="btn" onClick={onClose}><Ico.close/> Hide compare</button>
        </div>
      </div>
      <div className="compare">
        {cols.map((c) => (
          <div
            key={c.id}
            className={"compare-col " + c.id}
            onClick={() => onPickScenario(c.id)}
            style={{ cursor: "pointer" }}
          >
            <div className="head">
              <span className="label">{c.label}</span>
              <span className="num muted" style={{ fontSize: 11 }}>
                vs base {((c.data.ev / base.ev - 1) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <div className="big">
                <span className="num-display">{(c.data.ev / 1000).toFixed(1)}</span>
                <span className="unit">B {ccy} EV</span>
              </div>
              <div className="sub" style={{ marginTop: 6 }}>
                Implied share price{" "}
                <strong className="num" style={{ color: "var(--text)" }}>
                  {ccy} {c.data.sharePrice.toFixed(2)}
                </strong>
              </div>
            </div>
            <div className="bar"><div style={{ width: (c.data.ev / maxEv * 100) + "%" }}/></div>
            <div className="stat-list">
              <div className="stat"><span className="k">Revenue Year-5</span><span className="v">{Math.round(c.data.year5Revenue).toLocaleString("en-US")}</span></div>
              <div className="stat"><span className="k">EBITDA margin avg</span><span className="v">{c.data.avgMargin.toFixed(1)}%</span></div>
              <div className="stat"><span className="k">FCF Year-5</span><span className="v">{Math.round(c.data.year5Fcf).toLocaleString("en-US")}</span></div>
              <div className="stat"><span className="k">Terminal share</span><span className="v">{c.data.terminal.toFixed(0)}%</span></div>
              <div className="stat"><span className="k">Equity value</span><span className="v">{Math.round(c.data.equity).toLocaleString("en-US")}</span></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
