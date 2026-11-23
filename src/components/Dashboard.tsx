"use client";
import { useEffect, useMemo, useState } from "react";
import { Ico } from "./icons";
import { Sparkline } from "./Market";
import { findTicker, type TickerInfo } from "@/lib/marketDb";
import { marketSourceLabel, useMarketQuotes, dayChange } from "@/lib/useMarketData";
import { SECTOR_TEMPLATES, type SectorTemplate } from "@/lib/templates";
import type { AppUser } from "@/lib/user";

export type RecentCase = {
  id: string;
  name: string;
  ticker: string;
  scenario: "base" | "upside" | "downside";
  status: "Draft" | "In review" | "Approved" | "Archived";
  author: string;
  updated: string;
};

export function Dashboard({
  recentCases, watchlist, memoCount,
  onOpenCase, onNewCase, onOpenTicker, onOpenSearch, onOpenLibrary,
}: {
  user: AppUser;
  recentCases: RecentCase[];
  watchlist: string[];                       // ticker[]
  memoCount: number;
  onOpenCase: (id: string) => void;
  onNewCase: (ticker?: TickerInfo, template?: SectorTemplate) => void;
  onOpenTicker: (t: TickerInfo) => void;
  onOpenSearch: () => void;
  onOpenLibrary: () => void;
}) {
  const watchedSeeds = useMemo(
    () => watchlist.map((tk) => findTicker(tk)).filter((x): x is TickerInfo => Boolean(x)),
    [watchlist]
  );
  const { tickers: watched, loading: marketLoading, error: marketError, refresh: refreshMarket } = useMarketQuotes(watchedSeeds);

  const sectorPerf = useMemo(() => {
    const map: Record<string, { sum: number; n: number; cap: number }> = {};
    watched.forEach((t) => {
      const chg = dayChange(t);
      if (t.priv || chg == null) return;   // nur echte Kurse — ein Tageswechsel aus dem Katalog wäre erfunden
      if (!map[t.sector]) map[t.sector] = { sum: 0, n: 0, cap: 0 };
      map[t.sector].sum += chg;
      map[t.sector].n += 1;
      map[t.sector].cap += t.mktCap;
    });
    return Object.entries(map)
      .map(([sector, v]) => ({ sector, avg: v.sum / v.n, cap: v.cap }))
      .sort((a, b) => b.cap - a.cap);
  }, [watched]);

  // Das Datum erst im Browser setzen: Die Seite wird beim Bauen vorgerendert, und
  // ein dort eingesetztes Datum widerspräche am nächsten Tag dem im Browser.
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }));
  }, []);
  const liveRows = watched.filter((t) => dayChange(t) != null);
  const upCount = liveRows.filter((t) => (dayChange(t) ?? 0) > 0).length;
  const byStatus = (s: RecentCase["status"]) => recentCases.filter((c) => c.status === s).length;
  const activeCases = recentCases.length - byStatus("Archived");

  return (
    <div className="dashboard">
      <section className="dash-welcome">
        <div>
          <span className="eyebrow">{today || "\u00a0"}</span>
          <h1>Welcome to DealDesk.</h1>
          <p>Value companies with DCF, trading comps and LBO in one place. Your cases stay in this browser — no account needed.</p>
        </div>
        <div className="dash-welcome-actions">
          <button className="btn" onClick={onOpenSearch}>
            <Ico.search/> Search ticker <span className="kbd-inline">⌘K</span>
          </button>
          <button className="btn primary" onClick={() => onNewCase()}>
            <Ico.plus/> New case
          </button>
        </div>
      </section>

      <section className="dash-kpis">
        <div className="dash-kpi">
          <span className="eyebrow">Active cases</span>
          <div className="dash-kpi-v"><span className="num-display">{activeCases}</span></div>
          <span className="dash-kpi-sub">{byStatus("Draft")} draft · {byStatus("In review")} in review</span>
        </div>
        <div className="dash-kpi">
          <span className="eyebrow">Watchlist tickers</span>
          <div className="dash-kpi-v"><span className="num-display">{watched.length}</span></div>
          <span className="dash-kpi-sub">
            {liveRows.length ? (
              <>
                <span style={{ color: "var(--green)" }}>{upCount} up</span>
                {" · "}
                <span style={{ color: "var(--red)" }}>{liveRows.length - upCount} down</span>
                {liveRows.length < watched.length && <> · {watched.length - liveRows.length} sample</>}
              </>
            ) : "sample prices only"}
          </span>
        </div>
        <div className="dash-kpi">
          <span className="eyebrow">Memos generated</span>
          <div className="dash-kpi-v"><span className="num-display">{memoCount}</span></div>
          <span className="dash-kpi-sub">of {recentCases.length} cases</span>
        </div>
        <div className="dash-kpi">
          <span className="eyebrow">Approved</span>
          <div className="dash-kpi-v"><span className="num-display">{byStatus("Approved")}</span></div>
          <span className="dash-kpi-sub">{byStatus("Archived")} archived</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div className="head-title">
            <span className="eyebrow">Live market data</span>
            <h2>Watchlist</h2>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="head-aux">
              {marketLoading ? "Refreshing…"
                : marketError || liveRows.length === 0 ? "Sample prices · live feed unavailable"
                : liveRows.length < watched.length ? `${liveRows.length} of ${watched.length} live · ${marketSourceLabel(liveRows[0])}`
                : marketSourceLabel(liveRows[0])}
            </span>
            <button className="btn" onClick={refreshMarket}><Ico.refresh/> Refresh</button>
            <button className="btn" onClick={onOpenSearch}><Ico.plus/> Add ticker</button>
          </div>
        </div>
        <div className="panel-body tight">
          <table className="data-table watchlist-table">
            <thead>
              <tr>
                <th style={{ width: 120 }}>Ticker</th>
                <th>Company</th>
                <th>Sector</th>
                <th>Last</th>
                <th>Day Δ</th>
                <th>1M trend</th>
                <th>Mkt cap</th>
                <th>EV / EBITDA</th>
                <th>P / E</th>
                <th>Beta</th>
                <th style={{ width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {watched.map((t) => {
                const chg = dayChange(t);
                return (
                  <tr key={t.ticker} className="watchlist-row" onClick={() => onOpenTicker(t)}>
                    <td>
                      <div className="ts-tick" style={{ minWidth: 0 }}>
                        <span className="ts-tick-symbol">{t.ticker.split(".")[0]}</span>
                        <span className="ts-tick-ex">{t.exchange}</span>
                      </div>
                    </td>
                    <td>{t.name}</td>
                    <td><span className="tag" style={{ fontSize: 10.5, height: 18, padding: "0 6px" }}>{t.subSector}</span></td>
                    <td title={marketSourceLabel(t)} className={t.live ? undefined : "muted"}>
                      {t.price.toFixed(2)} <span className="muted" style={{ fontSize: 10 }}>{t.ccy}</span>
                    </td>
                    <td>{chg != null
                      ? <span className={"delta " + (chg >= 0 ? "up" : "down")}>{chg >= 0 ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%</span>
                      : <span className="muted" title="Sample price — no live quote">—</span>}</td>
                    <td style={{ padding: 0 }}>
                      <div style={{ display: "grid", placeItems: "center", padding: 6 }}>
                        <Sparkline data={t.history ?? []} positive={(t.history ? t.history[t.history.length - 1] >= t.history[0] : true)} w={80} h={22}/>
                      </div>
                    </td>
                    <td>{(t.mktCap / 1000).toFixed(1)}B</td>
                    <td>{t.evEbitda > 0 ? t.evEbitda.toFixed(1) + "x" : "—"}</td>
                    <td>{t.pe > 0 ? t.pe.toFixed(1) + "x" : "—"}</td>
                    <td>{t.beta.toFixed(2)}</td>
                    <td>
                      <button className="btn" style={{ height: 26, fontSize: 11.5, padding: "0 8px" }}
                              onClick={(e) => { e.stopPropagation(); onNewCase(t); }}>
                        New case
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="dash-grid-2">
        <section className="panel">
          <div className="panel-head">
            <div className="head-title">
              <span className="eyebrow">Workspace</span>
              <h2>Recent cases</h2>
            </div>
            <button className="btn" onClick={onOpenLibrary}>Open library →</button>
          </div>
          <div className="recent-list">
            {recentCases.slice(0, 5).map((c) => (
              <div key={c.id} className="recent-row" onClick={() => onOpenCase(c.id)}>
                <div className={"recent-scen " + c.scenario}>
                  <span className="scenario-dot inline-dot"/>
                  {c.scenario}
                </div>
                <div className="recent-co">
                  <span className="recent-co-name">{c.name}</span>
                  <span className="recent-co-tick">{c.ticker}</span>
                </div>
                <div className="recent-status">
                  <span className="tag" style={{ fontSize: 10, height: 18, padding: "0 6px" }}>{c.status}</span>
                </div>
                <div className="recent-aux">
                  <span className="num" style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.updated}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>by {c.author}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="head-title">
              <span className="eyebrow">Market overview</span>
              <h2>Watchlist sectors · today</h2>
            </div>
            <span className="head-aux">Live quotes only · daily Δ</span>
          </div>
          <div className="sector-heatmap">
            {sectorPerf.length === 0 && (
              <div className="heat-empty">No live quotes right now — the sector view only uses real daily moves.</div>
            )}
            {sectorPerf.map((s) => {
              const intensity = Math.min(Math.abs(s.avg) / 3, 1);
              const bg = s.avg >= 0
                ? `color-mix(in oklab, var(--green) ${intensity * 30}%, var(--panel))`
                : `color-mix(in oklab, var(--red) ${intensity * 30}%, var(--panel))`;
              const fontSize = Math.max(11 + (s.cap / 3500000) * 14, 11);
              return (
                <div key={s.sector} className="heat-tile" style={{ background: bg }}>
                  <span className="heat-sec" style={{ fontSize }}>{s.sector}</span>
                  <span className={"delta " + (s.avg >= 0 ? "up" : "down")} style={{ fontSize: 11 }}>
                    {s.avg >= 0 ? "+" : ""}{s.avg.toFixed(2)}%
                  </span>
                  <span className="heat-cap">{(s.cap / 1000).toFixed(0)}B mkt cap</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div className="head-title">
            <span className="eyebrow" id="templates">Start faster</span>
            <h2>Sector templates</h2>
          </div>
          <span className="head-aux">Pre-built DCF assumptions tuned per industry</span>
        </div>
        <div className="template-grid">
          {SECTOR_TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="template-card" onClick={() => onNewCase(undefined, tpl)}>
              <div className="template-mark" style={{ background: tpl.color }}>{tpl.glyph}</div>
              <div className="template-body">
                <span className="template-name">{tpl.name}</span>
                <span className="template-desc">{tpl.desc}</span>
                <div className="template-tags">
                  <span className="num">WACC {tpl.wacc}%</span>
                  <span className="num">g {tpl.terminal}%</span>
                  <span className="num">{tpl.exitMultiple}x exit</span>
                </div>
              </div>
              <div className="template-arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="dash-foot">
        DealDesk is an educational prototype. Market prices come from public sources and may be
        delayed or replaced by sample data; sample cases and their authors are fictional.
        Nothing here is investment advice.
        <span className="dash-foot-links">
          <a href="/methodology">Methodology</a> · <a href="/impressum">Impressum</a> · <a href="/datenschutz">Datenschutz</a>
        </span>
      </footer>
    </div>
  );
}
