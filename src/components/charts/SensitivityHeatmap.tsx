"use client";

import { Fragment } from "react";

type Props = {
  rows: { wacc: number; values: number[] }[];
  cols: number[];
  baseRow: number;
  baseCol: number;
  ccy: string;
};

export function SensitivityHeatmap({ rows, cols, baseRow, baseCol, ccy }: Props) {
  const all = rows.flatMap((r) => r.values);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const ratio = (v: number) => (max === min ? 0.5 : (v - min) / (max - min));

  function cellColor(v: number) {
    const r = ratio(v);
    const lo = [255, 247, 230];
    const hi = [234, 240, 251];
    const c = lo.map((a, i) => Math.round(a + (hi[i] - a) * r));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }
  function cellText(v: number) {
    const r = ratio(v);
    if (r >= 0.7) return "var(--blue)";
    if (r <= 0.3) return "var(--gold)";
    return "var(--text)";
  }

  return (
    <div className="sens-grid">
      <div className="sens-cell h">WACC ↓ · g →</div>
      {cols.map((c, i) => (
        <div key={i} className="sens-cell h">g = {c.toFixed(1)}%</div>
      ))}
      {rows.map((r, ri) => (
        <Fragment key={ri}>
          <div className="sens-cell r">{r.wacc.toFixed(1)}%</div>
          {r.values.map((v, ci) => {
            const isBase = ri === baseRow && ci === baseCol;
            return (
              <div
                key={ci}
                className={"sens-cell" + (isBase ? " base-cell" : "")}
                style={{
                  background: cellColor(v),
                  color: cellText(v),
                  fontWeight: isBase ? 700 : 500,
                }}
              >
                {ccy} {v.toFixed(2)}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
