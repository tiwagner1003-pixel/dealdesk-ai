"use client";

type Row = { label: string; low: number; high: number };

type Props = {
  rows: Row[];
  scaleMax: number;
  ccy: string;
  currentEv: number;
};

export function FootballField({ rows, scaleMax, ccy, currentEv }: Props) {
  const W = 880, H = 320;
  const M = { l: 168, r: 96, t: 24, b: 44 };
  const innerW = W - M.l - M.r;
  const innerH = H - M.t - M.b;
  const rowH = innerH / rows.length;

  const ticks = 6;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => (scaleMax / ticks) * i);

  const x = (v: number) => M.l + (v / scaleMax) * innerW;

  // Die Spanne steht immer zuletzt und immer in Gold — auch wenn ohne Peers
  // nur DCF und Spanne übrig bleiben.
  const palette = ["#1e5bd8", "#4f8afe", "#7eaaf7"];
  const colors = rows.map((_, i) => i === rows.length - 1 ? "#b7791f" : palette[i] ?? palette[palette.length - 1]);

  return (
    <div className="football-svg-wrap">
      <svg className="football-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {tickVals.map((tv, i) => (
          <line key={i} x1={x(tv)} x2={x(tv)} y1={M.t} y2={H - M.b}
            stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"/>
        ))}
        {rows.map((_, i) => (
          <line key={i} x1={M.l} x2={W - M.r}
            y1={M.t + (i + 1) * rowH} y2={M.t + (i + 1) * rowH}
            stroke="currentColor" strokeOpacity="0.06"/>
        ))}

        {rows.map((r, i) => {
          const y = M.t + i * rowH + rowH * 0.18;
          const h = rowH * 0.42;
          const xl = x(r.low);
          const xh = x(r.high);
          const isBlended = i === rows.length - 1;
          return (
            <g key={r.label}>
              <text x={M.l - 16} y={y + h / 2 + 4} textAnchor="end"
                fontFamily="var(--font-sans)" fontSize="11"
                fontWeight={isBlended ? "700" : "600"}
                fill={isBlended ? "var(--text)" : "var(--muted)"}
                style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {r.label}
              </text>
              <rect x={xl} y={y} width={Math.max(xh - xl, 2)} height={h}
                fill={colors[i % colors.length]} rx="2"
                opacity={isBlended ? 1 : 0.85}/>
              {isBlended && (
                <rect x={xl - 1} y={y - 1}
                  width={Math.max(xh - xl, 2) + 2} height={h + 2}
                  fill="none" stroke="var(--navy)" strokeWidth="1.5" rx="3"/>
              )}
              <text x={xl - 6} y={y + h / 2 + 4} textAnchor="end"
                fontFamily="var(--font-mono)" fontSize="10" fill="var(--muted)">
                {(r.low / 1000).toFixed(1)}B
              </text>
              <text x={xh + 6} y={y + h / 2 + 4} textAnchor="start"
                fontFamily="var(--font-mono)" fontSize="10" fontWeight="600"
                fill="var(--text)">
                {(r.high / 1000).toFixed(1)}B
              </text>
            </g>
          );
        })}

        <line x1={x(currentEv)} x2={x(currentEv)}
          y1={M.t - 4} y2={H - M.b + 4}
          stroke="var(--navy)" strokeWidth="1.5" strokeDasharray="3 3"/>
        <rect x={x(currentEv) - 36} y={M.t - 18} width="72" height="16"
          fill="var(--navy)" rx="2"/>
        <text x={x(currentEv)} y={M.t - 7} textAnchor="middle"
          fontFamily="var(--font-mono)" fontSize="10" fontWeight="600" fill="#fff">
          BASE · {(currentEv / 1000).toFixed(1)}B
        </text>

        {tickVals.map((tv, i) => (
          <g key={i}>
            <line x1={x(tv)} x2={x(tv)} y1={H - M.b} y2={H - M.b + 4}
              stroke="currentColor" strokeOpacity="0.3"/>
            <text x={x(tv)} y={H - M.b + 18} textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize="10" fill="var(--muted)">
              {tv === 0 ? "0" : (tv / 1000).toFixed(0) + "B"}
            </text>
          </g>
        ))}
        <text x={W - M.r} y={H - 6} textAnchor="end"
          fontFamily="var(--font-mono)" fontSize="10" fill="var(--muted)">
          Enterprise value · {ccy}m
        </text>
      </svg>

      <div className="football-legend">
        {rows.map((r, i) => (
          <span key={r.label} className="swatch"><i style={{ background: colors[i] }}></i> {r.label}</span>
        ))}
        <span className="ml-auto">— — current base case</span>
      </div>
    </div>
  );
}
