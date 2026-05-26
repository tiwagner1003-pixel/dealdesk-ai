"use client";

import { Ico } from "../icons";
import type { Peer } from "@/lib/types";

type Props = {
  peers: Peer[];
  onPeer: (index: number, field: keyof Peer, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  median: {
    revenueGrowth: number;
    ebitdaMargin: number;
    evRevenue: number;
    evEbitda: number;
  };
  onNext: () => void;
};

export function PeersPanel({ peers, onPeer, onAdd, onRemove, median, onNext }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div className="head-title">
          <span className="eyebrow">Workflow · Step 03</span>
          <h2>Trading comps</h2>
        </div>
        <button className="btn" onClick={onAdd}><Ico.plus/> Add peer</button>
      </div>
      <div className="panel-body tight">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>Company</th>
              <th style={{ width: 80 }}>Ticker</th>
              <th>Rev Growth</th>
              <th>EBITDA Margin</th>
              <th>EV / Revenue</th>
              <th>EV / EBITDA</th>
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {peers.map((p, i) => (
              <tr key={i} className={p.included ? "" : "excluded"}>
                <td>
                  <span
                    className={"check" + (p.included ? " on" : "")}
                    onClick={() => onPeer(i, "included", String(!p.included))}
                  >
                    {p.included && <Ico.check/>}
                  </span>
                </td>
                <td>
                  <input className="text" value={p.name} onChange={(e) => onPeer(i, "name", e.target.value)}/>
                </td>
                <td>
                  <input value={p.ticker} onChange={(e) => onPeer(i, "ticker", e.target.value.toUpperCase())}/>
                </td>
                <td>
                  <input type="number" value={p.revenueGrowth} onChange={(e) => onPeer(i, "revenueGrowth", e.target.value)}/>
                </td>
                <td>
                  <input type="number" value={p.ebitdaMargin} onChange={(e) => onPeer(i, "ebitdaMargin", e.target.value)}/>
                </td>
                <td>
                  <input type="number" step="0.1" value={p.evRevenue} onChange={(e) => onPeer(i, "evRevenue", e.target.value)}/>
                </td>
                <td>
                  <input type="number" step="0.1" value={p.evEbitda} onChange={(e) => onPeer(i, "evEbitda", e.target.value)}/>
                </td>
                <td className="actions">
                  <button className="icon-btn" onClick={() => onRemove(i)} aria-label="Remove">
                    <Ico.trash/>
                  </button>
                </td>
              </tr>
            ))}
            <tr className="median">
              <td></td>
              <td>Median (included)</td>
              <td></td>
              <td>{median.revenueGrowth.toFixed(1)}%</td>
              <td>{median.ebitdaMargin.toFixed(1)}%</td>
              <td>{median.evRevenue.toFixed(1)}x</td>
              <td>{median.evEbitda.toFixed(1)}x</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 0 4px" }}>
        <button className="btn primary" onClick={onNext}>
          Next: Valuation →
        </button>
      </div>
    </section>
  );
}
