"use client";

import type { ProjectionYear } from "@/lib/types";

type Props = {
  projection: ProjectionYear[];
  ccy: string;
};

export function FcfChart({ projection, ccy: _ccy }: Props) {
  const W = 880, H = 240;
  const M = { l: 48, r: 48, t: 20, b: 32 };
  const innerW = W - M.l - M.r;
  const innerH = H - M.t - M.b;

  const maxRev = Math.max(...projection.map((p) => p.revenue));
  const maxBar = Math.max(maxRev, 1);

  const barW = innerW / projection.length * 0.4;
  const groupW = innerW / projection.length;

  const x = (i: number) => M.l + i * groupW + groupW / 2;
  const yScale = (v: number) => M.t + innerH - (v / maxBar) * innerH * 0.95;

  return (
    <div className="fcf-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="fcf-svg" preserveAspectRatio="xMidYMid meet">
        {[0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i}
            x1={M.l} x2={W - M.r}
            y1={M.t + innerH - innerH * 0.95 * t}
            y2={M.t + innerH - innerH * 0.95 * t}
            stroke="currentColor" strokeOpacity="0.06"/>
        ))}
        <line x1={M.l} x2={W - M.r}
          y1={M.t + innerH} y2={M.t + innerH}
          stroke="currentColor" strokeOpacity="0.2"/>

        {projection.map((p, i) => {
          const cx = x(i);
          const yr = yScale(p.revenue);
          const ye = yScale(p.ebitda);
          const yf = yScale(p.fcf);
          const baseY = M.t + innerH;
          return (
            <g key={i}>
              <rect x={cx - barW * 1.5} y={yr} width={barW} height={baseY - yr}
                fill="var(--blue-soft)" rx="2"/>
              <rect x={cx - barW * 0.5} y={ye} width={barW} height={baseY - ye}
                fill="#7eaaf7" rx="2"/>
              <rect x={cx + barW * 0.5} y={yf} width={barW} height={baseY - yf}
                fill="var(--blue)" rx="2"/>
              <text x={cx} y={baseY + 18} textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize="10" fill="var(--muted)">
                Y{p.year}
              </text>
            </g>
          );
        })}

        <g transform={`translate(${M.l}, ${M.t - 2})`}>
          <rect x="0" y="0" width="10" height="10" fill="var(--blue-soft)" rx="2"/>
          <text x="16" y="9" fontSize="10" fontFamily="var(--font-sans)" fill="var(--muted)">Revenue</text>
          <rect x="80" y="0" width="10" height="10" fill="#7eaaf7" rx="2"/>
          <text x="96" y="9" fontSize="10" fontFamily="var(--font-sans)" fill="var(--muted)">EBITDA</text>
          <rect x="160" y="0" width="10" height="10" fill="var(--blue)" rx="2"/>
          <text x="176" y="9" fontSize="10" fontFamily="var(--font-sans)" fill="var(--muted)">FCF</text>
        </g>
      </svg>

      <div className="fcf-row">
        {projection.map((p) => (
          <div key={p.year} className="cell">
            <span className="lbl">Year {p.year}</span>
            <span className="val">{Math.round(p.revenue).toLocaleString()}</span>
            <span style={{ fontSize: 10.5, color: "var(--muted)" }}>
              g {p.revenueGrowth.toFixed(1)}% · m {p.ebitdaMargin.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
