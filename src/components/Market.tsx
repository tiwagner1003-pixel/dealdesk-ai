"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Ico } from "./icons";
import { MARKET_DB, priceSeries, type TickerInfo } from "@/lib/marketDb";
import { marketSourceLabel, useMarketQuotes, type MarketAwareTicker } from "@/lib/useMarketData";

/* ────────────────────────────────────────────────────────────────
   Sparkline
   ──────────────────────────────────────────────────────────────── */
export function Sparkline({ data, w = 84, h = 24, positive }: {
  data: number[]; w?: number; h?: number; positive: boolean;
}) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / rng) * h;
    return [x, y] as [number, number];
  });
  const d = "M" + pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L");
  const area = d + ` L${w},${h} L0,${h}Z`;
  const color = positive ? "var(--green)" : "var(--red)";
  const id = "sp-" + (positive ? "g" : "r") + "-" + (data[0] | 0);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.25"/>
          <stop offset="1" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.4"/>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────
   Big interactive price chart — TradingView-style
   ──────────────────────────────────────────────────────────────── */
type Range = "1D" | "1M" | "1Y" | "5Y";

export function PriceChart({ t, height = 240 }: { t: TickerInfo; height?: number }) {
  const [range, setRange] = useState<Range>("1Y");
  const data = useMemo(() => priceSeries(t, range), [t.ticker, t.price, range]);
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ i: number; x: number; y: number; v: number } | null>(null);

  if (t.priv) {
    return (
      <div style={{
        height, display: "grid", placeItems: "center",
        background: "var(--panel-soft)", border: "1px solid var(--line)", borderRadius: 6,
        color: "var(--muted)", fontSize: 12.5, fontFamily: "var(--font-mono)",
      }}>
        Private company · no public market data
      </div>
    );
  }

  const W = 800, H = height;
  const padL = 50, padR = 12, padT = 18, padB = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => {
    const x = padL + (i / (data.length - 1)) * (W - padL - padR);
    const y = padT + (H - padT - padB) - ((v - min) / rng) * (H - padT - padB);
    return [x, y] as [number, number];
  });
  const d = "M" + pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L");
  const area = d + ` L${pts[pts.length - 1][0]},${H - padB} L${pts[0][0]},${H - padB}Z`;
  const positive = data[data.length - 1] >= data[0];
  const color = positive ? "var(--green)" : "var(--red)";
  const change = ((data[data.length - 1] / data[0]) - 1) * 100;

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    if (x < padL || x > W - padR) { setHover(null); return; }
    const i = Math.round(((x - padL) / (W - padL - padR)) * (data.length - 1));
    setHover({ i, x: pts[i][0], y: pts[i][1], v: data[i] });
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => {
    const val = min + rng * p;
    const y = padT + (H - padT - padB) - p * (H - padT - padB);
    return { y, val };
  });

  const xLabels = range === "1D" ? ["09:30", "11:00", "12:30", "14:00", "15:30"]
    : range === "1M" ? ["W1", "W2", "W3", "W4"]
    : range === "5Y" ? ["−5Y", "−4Y", "−3Y", "−2Y", "−1Y", "Now"]
    : ["Jan", "Mar", "May", "Jul", "Sep", "Nov"];

  return (
    <div className="price-chart">
      <div className="price-chart-head">
        <div className="pc-price">
          <span className="num-display" style={{ fontSize: 28 }}>
            {hover ? hover.v.toFixed(2) : t.price.toFixed(2)}
          </span>
          <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)", marginLeft: 8 }}>
            {t.ccy}
          </span>
          <span className={"delta " + (positive ? "up" : "down")} style={{ marginLeft: 12, fontSize: 13 }}>
            {positive ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
          </span>
        </div>
        <div className="pc-range">
          {(["1D", "1M", "1Y", "5Y"] as Range[]).map((r) => (
            <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="pc-svg" preserveAspectRatio="none"
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="pc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.22"/>
            <stop offset="1" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="var(--line)" strokeDasharray="2 4"/>
            <text x={padL - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="var(--muted)" fontFamily="var(--font-mono)">
              {t.val.toFixed(t.val >= 100 ? 0 : 2)}
            </text>
          </g>
        ))}
        {xLabels.map((lbl, i) => {
          const x = padL + (i / (xLabels.length - 1)) * (W - padL - padR);
          return <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="var(--font-mono)">{lbl}</text>;
        })}
        <path d={area} fill="url(#pc-grad)"/>
        <path d={d} fill="none" stroke={color} strokeWidth="1.6"/>
        {hover && (
          <g>
            <line x1={hover.x} y1={padT} x2={hover.x} y2={H - padB} stroke="var(--text)" strokeDasharray="2 3" strokeWidth="1"/>
            <circle cx={hover.x} cy={hover.y} r="4" fill="var(--panel)" stroke={color} strokeWidth="1.6"/>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Market data card
   ──────────────────────────────────────────────────────────────── */
export function MarketDataCard({ t }: { t: TickerInfo | MarketAwareTicker }) {
  if (t.priv) {
    return (
      <div className="market-card">
        <div className="market-card-head">
          <div>
            <span className="eyebrow">Private Markets</span>
            <span className="market-card-time">Last round · valuation</span>
          </div>
        </div>
        <div className="market-card-grid">
          <div className="md"><span className="l">Implied valuation</span><span className="v">{(t.mktCap / 1000).toFixed(1)}B {t.ccy}</span></div>
          <div className="md"><span className="l">Net cash / debt</span><span className="v">{t.netDebt < 0 ? "−" : ""}{Math.abs(t.netDebt / 1000).toFixed(1)}B {t.ccy}</span></div>
          <div className="md"><span className="l">Revenue (LTM)</span><span className="v">{(t.revenue / 1000).toFixed(1)}B {t.ccy}</span></div>
          <div className="md"><span className="l">EV / Revenue</span><span className="v">{t.evRev.toFixed(1)}x</span></div>
        </div>
      </div>
    );
  }

  const chg = ((t.price - t.prevClose) / t.prevClose) * 100;
  const pos = chg >= 0;
  const ev = t.mktCap + t.netDebt;
  const source = "marketSource" in t ? marketSourceLabel(t) : "Seed fallback";

  return (
    <div className="market-card">
      <div className="market-card-head">
        <div>
          <span className="eyebrow">Market data</span>
          <span className="market-card-time">{source}</span>
        </div>
        <div className="pc-quote">
          <span className="num-display" style={{ fontSize: 22 }}>{t.price.toFixed(2)}</span>
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", marginLeft: 6 }}>{t.ccy}</span>
          <span className={"delta " + (pos ? "up" : "down")} style={{ marginLeft: 10, fontSize: 12 }}>
            {pos ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="market-card-grid">
        <div className="md"><span className="l">Market cap</span><span className="v">{(t.mktCap / 1000).toFixed(1)}B {t.ccy}</span></div>
        <div className="md"><span className="l">Enterprise value</span><span className="v">{(ev / 1000).toFixed(1)}B {t.ccy}</span></div>
        <div className="md"><span className="l">P / E (LTM)</span><span className="v">{t.pe > 0 ? t.pe.toFixed(1) + "x" : "n/m"}</span></div>
        <div className="md"><span className="l">EV / EBITDA</span><span className="v">{t.evEbitda > 0 ? t.evEbitda.toFixed(1) + "x" : "n/m"}</span></div>
        <div className="md"><span className="l">EV / Revenue</span><span className="v">{t.evRev.toFixed(1)}x</span></div>
        <div className="md"><span className="l">Beta (5Y)</span><span className="v">{t.beta.toFixed(2)}</span></div>
        <div className="md"><span className="l">Div yield</span><span className="v">{t.divYield > 0 ? t.divYield.toFixed(1) + "%" : "—"}</span></div>
        <div className="md"><span className="l">52w range</span><span className="v" style={{ fontSize: 11.5 }}>{t.range52w[0]} – {t.range52w[1]}</span></div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   ⌘K Ticker search command palette
   ──────────────────────────────────────────────────────────────── */
export function TickerSearch({
  open, onClose, onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (t: TickerInfo) => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      setQ("");
      setActive(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return MARKET_DB.slice(0, 8);
    return MARKET_DB.filter((t) =>
      t.ticker.toLowerCase().includes(s) ||
      t.name.toLowerCase().includes(s) ||
      t.sector.toLowerCase().includes(s)
    ).slice(0, 10);
  }, [q]);
  const { tickers: displayResults } = useMarketQuotes(open ? results : []);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, displayResults.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (displayResults[active]) onPick(displayResults[active]); }
  }

  if (!open) return null;
  return (
    <div className="ticker-backdrop" onClick={onClose}>
      <div className="ticker-search" onClick={(e) => e.stopPropagation()}>
        <div className="ts-input">
          <Ico.search/>
          <input ref={inputRef} value={q}
                 onChange={(e) => { setQ(e.target.value); setActive(0); }}
                 onKeyDown={onKey}
                 placeholder="Search ticker, company or sector — e.g. ADYEN, Stripe, Payments…"/>
          <span className="ts-kbd">esc</span>
        </div>
        <div className="ts-list">
          {displayResults.length === 0 && <div className="ts-empty">No matches. Try a different ticker.</div>}
          {displayResults.map((t, i) => {
            const chg = t.price ? ((t.price - t.prevClose) / t.prevClose) * 100 : 0;
            return (
              <div key={t.ticker} className={"ts-row" + (i === active ? " active" : "")}
                   onMouseEnter={() => setActive(i)}
                   onClick={() => onPick(t)}>
                <div className="ts-tick">
                  <span className="ts-tick-symbol">{t.ticker.split(".")[0]}</span>
                  <span className="ts-tick-ex">{t.exchange}</span>
                </div>
                <div className="ts-name">
                  <span className="ts-name-co">{t.name}</span>
                  <span className="ts-name-sec">{t.sector} · {t.subSector}</span>
                </div>
                <div className="ts-spark">
                  <Sparkline data={priceSeries(t, "1M")} positive={chg >= 0} w={68} h={20}/>
                </div>
                <div className="ts-price">
                  {t.priv ? (
                    <span className="ts-priv">PRIV</span>
                  ) : (
                    <>
                      <span className="ts-price-v">{t.price.toFixed(2)}</span>
                      <span className={"delta " + (chg >= 0 ? "up" : "down")} style={{ fontSize: 11 }}>
                        {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                      </span>
                    </>
                  )}
                </div>
                <div className="ts-cap">{(t.mktCap / 1000).toFixed(0)}B {t.ccy}</div>
              </div>
            );
          })}
        </div>
        <div className="ts-foot">
          <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
          <span><kbd>⏎</kbd> open case</span>
          <span style={{ marginLeft: "auto" }}>{MARKET_DB.length} tickers</span>
        </div>
      </div>
    </div>
  );
}
