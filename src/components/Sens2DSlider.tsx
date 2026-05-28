"use client";
import { useMemo, useRef, useState } from "react";
import { calculateDcf } from "@/lib/finance";
import type { ModelInput, ForecastYear, Scenario } from "@/lib/types";

export function Sens2DSlider({
  model, forecast, scenario, onModelUpdate, ccy,
}: {
  model: ModelInput;
  forecast: ForecastYear[];
  scenario: Scenario;
  onModelUpdate: (patch: Partial<ModelInput>) => void;
  ccy: string;
}) {
  const W = 540, H = 360;
  const padL = 60, padR = 24, padT = 28, padB = 50;
  const waccMin = 6, waccMax = 13;
  const tgMin = 1, tgMax = 5;

  const x = padL + ((model.terminalGrowth - tgMin) / (tgMax - tgMin)) * (W - padL - padR);
  const y = padT + ((model.wacc - waccMin) / (waccMax - waccMin)) * (H - padT - padB);

  const grid = useMemo(() => {
    const NX = 24, NY = 24;
    const cells: { i: number; j: number; v: number }[] = [];
    let minV = Infinity, maxV = -Infinity;
    for (let i = 0; i < NY; i++) {
      const wacc = waccMin + (i / (NY - 1)) * (waccMax - waccMin);
      for (let j = 0; j < NX; j++) {
        const tg = tgMin + (j / (NX - 1)) * (tgMax - tgMin);
        const v = calculateDcf({ ...model, wacc, terminalGrowth: tg }, forecast, scenario).enterpriseValue;
        cells.push({ i, j, v });
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
    }
    return { cells, minV, maxV, NX, NY };
  }, [model.revenue, model.taxRate, model.shares, model.netDebt, model.exitMultiple, model.depreciationPercent, model.capexPercent, model.nwcPercent, JSON.stringify(forecast), scenario]);

  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);

  function setFromPointer(e: React.MouseEvent) {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    const tg = tgMin + Math.max(0, Math.min(1, (px - padL) / (W - padL - padR))) * (tgMax - tgMin);
    const wacc = waccMin + Math.max(0, Math.min(1, (py - padT) / (H - padT - padB))) * (waccMax - waccMin);
    onModelUpdate({
      wacc: Number(wacc.toFixed(2)),
      terminalGrowth: Number(tg.toFixed(2)),
    });
  }

  const current = useMemo(() => calculateDcf(model, forecast, scenario), [model, forecast, scenario]);

  return (
    <section className="panel">
      <div className="panel-head">
        <div className="head-title">
          <span className="eyebrow">Sensitivity · interactive</span>
          <h2>Drag crosshair · WACC × terminal growth</h2>
        </div>
        <span className="head-aux">EV heatmap · click or drag</span>
      </div>
      <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 24, alignItems: "start" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="sens2d-svg"
          onMouseDown={(e) => { setDragging(true); setFromPointer(e); }}
          onMouseMove={(e) => { if (dragging) setFromPointer(e); }}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
        >
          {grid.cells.map((c, i) => {
            const cellW = (W - padL - padR) / grid.NX;
            const cellH = (H - padT - padB) / grid.NY;
            const norm = (c.v - grid.minV) / (grid.maxV - grid.minV || 1);
            const cx = padL + c.j * cellW;
            const cy = padT + c.i * cellH;
            const opacity = 0.15 + norm * 0.45;
            return <rect key={i} x={cx} y={cy} width={cellW + 0.5} height={cellH + 0.5} fill="var(--blue)" opacity={opacity}/>;
          })}

          <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="var(--line)"/>
          <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="var(--line)"/>

          {[1, 2, 3, 4, 5].map((tg) => {
            const xi = padL + ((tg - tgMin) / (tgMax - tgMin)) * (W - padL - padR);
            return <g key={tg}>
              <line x1={xi} y1={H - padB} x2={xi} y2={H - padB + 4} stroke="var(--line-strong)"/>
              <text x={xi} y={H - padB + 16} textAnchor="middle" fontSize="10.5" fill="var(--muted)" fontFamily="var(--font-mono)">{tg}%</text>
            </g>;
          })}
          {[6, 7, 8, 9, 10, 11, 12, 13].map((w) => {
            const yi = padT + ((w - waccMin) / (waccMax - waccMin)) * (H - padT - padB);
            return <g key={w}>
              <line x1={padL - 4} y1={yi} x2={padL} y2={yi} stroke="var(--line-strong)"/>
              <text x={padL - 8} y={yi + 4} textAnchor="end" fontSize="10.5" fill="var(--muted)" fontFamily="var(--font-mono)">{w}%</text>
            </g>;
          })}

          <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="10.5" fill="var(--muted)"
                fontFamily="var(--font-sans)" fontWeight="600" letterSpacing="0.06em" style={{ textTransform: "uppercase" }}>
            Terminal growth (g)
          </text>
          <text x={14} y={H / 2} textAnchor="middle" fontSize="10.5" fill="var(--muted)"
                transform={`rotate(-90 14 ${H / 2})`}
                fontFamily="var(--font-sans)" fontWeight="600" letterSpacing="0.06em" style={{ textTransform: "uppercase" }}>
            WACC
          </text>

          <line x1={x} y1={padT} x2={x} y2={H - padB} stroke="var(--navy)" strokeWidth="1" strokeDasharray="2 3"/>
          <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--navy)" strokeWidth="1" strokeDasharray="2 3"/>
          <circle cx={x} cy={y} r="8" fill="var(--panel)" stroke="var(--navy)" strokeWidth="2"/>
          <circle cx={x} cy={y} r="3" fill="var(--navy)"/>

          <g transform={`translate(${Math.min(x + 14, W - 130)} ${Math.max(y - 28, padT + 4)})`}>
            <rect x="0" y="0" width="120" height="38" rx="4" fill="var(--panel)" stroke="var(--navy)" strokeWidth="1"/>
            <text x="8" y="14" fontSize="9.5" fontFamily="var(--font-sans)" fontWeight="600"
                  fill="var(--muted)" letterSpacing="0.06em" style={{ textTransform: "uppercase" }}>EV at this point</text>
            <text x="8" y="30" fontSize="13" fontFamily="var(--font-mono)" fontWeight="500" fill="var(--text)">
              {(current.enterpriseValue / 1000).toFixed(2)}B {ccy}
            </text>
          </g>
        </svg>

        <div className="sens2d-side">
          <h4>Crosshair</h4>
          <div className="sens2d-stat"><span className="l">WACC</span><span className="v num">{model.wacc.toFixed(2)}%</span></div>
          <div className="sens2d-stat"><span className="l">Terminal growth</span><span className="v num">{model.terminalGrowth.toFixed(2)}%</span></div>
          <div className="sens2d-stat" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <span className="l">Implied EV</span>
            <span className="v num" style={{ fontWeight: 600 }}>{(current.enterpriseValue / 1000).toFixed(2)}B {ccy}</span>
          </div>
          <div className="sens2d-stat"><span className="l">Implied share px</span><span className="v num">{current.sharePrice.toFixed(2)} {ccy}</span></div>
          <div className="sens2d-stat"><span className="l">EV range (full grid)</span>
            <span className="v num" style={{ fontSize: 11.5 }}>{(grid.minV / 1000).toFixed(1)} – {(grid.maxV / 1000).toFixed(1)}B</span>
          </div>
          <button className="btn" style={{ width: "100%", marginTop: 12 }}
                  onClick={() => onModelUpdate({ wacc: 9.5, terminalGrowth: 3.0 })}>
            Reset to base
          </button>
        </div>
      </div>
    </section>
  );
}
