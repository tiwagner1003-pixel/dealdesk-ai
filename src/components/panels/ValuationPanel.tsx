"use client";

import { FootballField } from "../charts/FootballField";
import { SensitivityHeatmap } from "../charts/SensitivityHeatmap";
import { FcfChart } from "../charts/FcfChart";
import type { DcfOutput, ProjectionYear } from "@/lib/types";

type Props = {
  ffRows: { label: string; low: number; high: number }[];
  scaleMax: number;
  ccy: string;
  currentEv: number;
  sensRows: { wacc: number; values: number[] }[];
  sensCols: number[];
  baseRow: number;
  baseCol: number;
  projection: ProjectionYear[];
  dcf: DcfOutput;
  currentEbitda: number;
  medianEvRevenue: number;
  medianEvEbitda: number;
  compsEvRevenue: number;
  compsEvEbitda: number;
};

export function ValuationPanel({
  ffRows, scaleMax, ccy, currentEv,
  sensRows, sensCols, baseRow, baseCol,
  projection, dcf,
  currentEbitda, medianEvRevenue, medianEvEbitda,
  compsEvRevenue, compsEvEbitda,
}: Props) {
  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1fr)" }}>
      <section className="panel">
        <div className="panel-head">
          <div className="head-title">
            <span className="eyebrow">Workflow · Step 04</span>
            <h2>Football field — enterprise value range</h2>
          </div>
          <span className="head-aux">{ccy}m · current base case marked</span>
        </div>
        <div className="football-wrap">
          <FootballField rows={ffRows} scaleMax={scaleMax} ccy={ccy} currentEv={currentEv}/>
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <div className="head-title">
              <span className="eyebrow">DCF · output</span>
              <h2>Discounted cash flow</h2>
            </div>
            <span className="head-aux">{ccy}m</span>
          </div>
          <div style={{ padding: "20px 20px 0" }}>
            <div className="kpi-card-hero" style={{ paddingTop: 0, borderBottom: 0 }}>
              <span className="kpi-label">Enterprise value</span>
              <div className="kpi-value">
                <span className="num-display">{(dcf.enterpriseValue / 1000).toFixed(2)}</span>
                <span className="unit">B {ccy}</span>
              </div>
            </div>
          </div>
          <table className="data-table">
            <tbody>
              <tr><td>Gordon growth EV</td><td>{Math.round(dcf.gordonEnterpriseValue).toLocaleString()}</td></tr>
              <tr><td>Exit multiple EV</td><td>{Math.round(dcf.exitEnterpriseValue).toLocaleString()}</td></tr>
              <tr><td>Equity value</td><td>{Math.round(dcf.equityValue).toLocaleString()}</td></tr>
              <tr><td>Implied share price</td><td>{ccy} {dcf.sharePrice.toFixed(2)}</td></tr>
              <tr><td>Terminal value share</td><td>{dcf.terminalShare.toFixed(0)}%</td></tr>
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="head-title">
              <span className="eyebrow">Comps · output</span>
              <h2>Trading comparables</h2>
            </div>
            <span className="head-aux">{ccy}m</span>
          </div>
          <div style={{ padding: "20px 20px 0" }}>
            <div className="kpi-card-hero" style={{ paddingTop: 0, borderBottom: 0 }}>
              <span className="kpi-label">Average comps EV</span>
              <div className="kpi-value">
                <span className="num-display">{((compsEvRevenue + compsEvEbitda) / 2 / 1000).toFixed(2)}</span>
                <span className="unit">B {ccy}</span>
              </div>
            </div>
          </div>
          <table className="data-table">
            <tbody>
              <tr><td>EV / Revenue (median peer)</td><td>{medianEvRevenue.toFixed(1)}x</td></tr>
              <tr><td>EV / EBITDA (median peer)</td><td>{medianEvEbitda.toFixed(1)}x</td></tr>
              <tr><td>Implied EV (Rev)</td><td>{Math.round(compsEvRevenue).toLocaleString()}</td></tr>
              <tr><td>Implied EV (EBITDA)</td><td>{Math.round(compsEvEbitda).toLocaleString()}</td></tr>
              <tr><td>Current EBITDA</td><td>{Math.round(currentEbitda).toLocaleString()}</td></tr>
            </tbody>
          </table>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div className="head-title">
            <span className="eyebrow">Sensitivity · Step 04b</span>
            <h2>WACC × terminal growth — implied share price</h2>
          </div>
          <span className="head-aux">{ccy} per share · base outlined</span>
        </div>
        <div className="panel-body">
          <SensitivityHeatmap
            rows={sensRows} cols={sensCols}
            baseRow={baseRow} baseCol={baseCol} ccy={ccy}
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div className="head-title">
            <span className="eyebrow">Five-year projection</span>
            <h2>Revenue, EBITDA &amp; FCF build</h2>
          </div>
          <span className="head-aux">{ccy}m</span>
        </div>
        <FcfChart projection={projection} ccy={ccy}/>
      </section>
    </div>
  );
}
