"use client";
import { useMemo, useState } from "react";
import { Ico } from "./icons";
import { Sparkline } from "./Market";
import { findTicker, priceSeries } from "@/lib/marketDb";

export type LibraryCase = {
  id: string;
  name: string;
  ticker: string;
  sector?: string;
  ccy?: string;
  scenario: "base" | "upside" | "downside";
  status: "Draft" | "In review" | "Approved" | "Archived";
  author: string;
  updated: string;
  ev?: number;          // target EV in m
  upside?: number;      // % vs spot
};

export function CaseLibrary({
  cases, onOpenCase, onNewCase, onDuplicateCase, onDeleteCase, onReset,
}: {
  cases: LibraryCase[];
  onOpenCase: (id: string) => void;
  onNewCase: () => void;
  onDuplicateCase: (id: string) => void;
  onDeleteCase: (id: string) => void;
  onReset: () => void;
}) {
  const [view, setView] = useState<"table" | "cards">("table");
  const [scenarioF, setScenarioF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [authorF, setAuthorF] = useState("all");
  const [search, setSearch] = useState("");

  const authors = useMemo(() => Array.from(new Set(cases.map((c) => c.author))), [cases]);

  const filtered = useMemo(() => cases.filter((c) => {
    if (scenarioF !== "all" && c.scenario !== scenarioF) return false;
    if (statusF !== "all" && c.status !== statusF) return false;
    if (authorF !== "all" && c.author !== authorF) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.name.toLowerCase().includes(s) &&
          !c.ticker.toLowerCase().includes(s) &&
          !(c.sector || "").toLowerCase().includes(s)) return false;
    }
    return true;
  }), [cases, scenarioF, statusF, authorF, search]);

  return (
    <div className="library">
      <section className="library-head">
        <div>
          <span className="eyebrow">Workspace</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 400, letterSpacing: "-0.02em" }}>
            Case library
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
            {filtered.length} of {cases.length} cases · across {authors.length} analysts
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={onReset} title="Restore the sample cases">Reset samples</button>
          <button className="btn" onClick={() => exportCsv(filtered)}><Ico.download/> Export CSV</button>
          <button className="btn primary" onClick={onNewCase}><Ico.plus/> New case</button>
        </div>
      </section>

      <section className="library-controls">
        <div className="library-search">
          <Ico.search/>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search company, ticker or sector…"/>
        </div>
        <div className="library-filters">
          <Filter label="Scenario" value={scenarioF} onChange={setScenarioF}
            options={[["all", "All"], ["base", "Base"], ["upside", "Upside"], ["downside", "Downside"]]}/>
          <Filter label="Status" value={statusF} onChange={setStatusF}
            options={[["all", "All"], ["Draft", "Draft"], ["In review", "In review"], ["Approved", "Approved"], ["Archived", "Archived"]]}/>
          <Filter label="Author" value={authorF} onChange={setAuthorF}
            options={[["all", "All authors"], ...authors.map((a) => [a, a] as [string, string])]}/>
        </div>
        <div className="library-view-toggle">
          <button className={view === "table" ? "active" : ""} onClick={() => setView("table")}>Table</button>
          <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")}>Cards</button>
        </div>
      </section>

      {view === "table" ? (
        <section className="panel">
          <div className="panel-body tight">
            <table className="data-table library-table">
              <thead>
                <tr>
                  <th style={{ width: 20 }}></th>
                  <th>Company</th>
                  <th>Sector</th>
                  <th>Scenario</th>
                  <th>Status</th>
                  <th>EV (target)</th>
                  <th>Implied / spot</th>
                  <th>Updated</th>
                  <th>Author</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="library-row" onClick={() => onOpenCase(c.id)}>
                    <td><span className={"scenario-dot " + c.scenario}/></td>
                    <td>
                      <div className="library-co">
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                        <span className="muted num" style={{ fontSize: 11 }}>{c.ticker}</span>
                      </div>
                    </td>
                    <td className="muted" style={{ fontFamily: "var(--font-sans)" }}>{c.sector || "—"}</td>
                    <td><span className={"scen-pill " + c.scenario}>{c.scenario}</span></td>
                    <td><span className={"status-pill status-" + c.status.toLowerCase().replace(" ", "-")}>{c.status}</span></td>
                    <td>{c.ev ? (c.ev / 1000).toFixed(1) + "B " + (c.ccy || "EUR") : "—"}</td>
                    <td>
                      {c.upside != null
                        ? <span className={"delta " + (c.upside >= 0 ? "up" : "down")}>
                            {c.upside >= 0 ? "+" : ""}{c.upside.toFixed(0)}%
                          </span>
                        : "—"}
                    </td>
                    <td className="muted num" style={{ fontSize: 11.5 }}>{c.updated}</td>
                    <td>{c.author}</td>
                    <td className="actions">
                      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onDuplicateCase(c.id); }} aria-label="Duplicate">⎘</button>
                      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onDeleteCase(c.id); }} aria-label="Delete"><Ico.trash/></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                    No cases match these filters.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="library-cards">
          {filtered.map((c) => {
            const t = findTicker(c.ticker);
            const positive = c.upside == null ? true : c.upside >= 0;
            return (
              <div key={c.id} className="lib-card" onClick={() => onOpenCase(c.id)}>
                <div className="lib-card-head">
                  <span className={"scen-pill " + c.scenario}>{c.scenario}</span>
                  <span className={"status-pill status-" + c.status.toLowerCase().replace(" ", "-")}>{c.status}</span>
                </div>
                <div className="lib-card-body">
                  <h3>{c.name}</h3>
                  <span className="muted num" style={{ fontSize: 11.5 }}>{c.ticker} · {c.sector || "—"}</span>
                  <div className="lib-card-mini">
                    <div><span className="l">EV target</span><span className="v">{c.ev ? (c.ev / 1000).toFixed(1) + "B" : "—"}</span></div>
                    <div><span className="l">vs spot</span><span className={"v delta " + (positive ? "up" : "down")}>
                      {c.upside != null ? (c.upside >= 0 ? "+" : "") + c.upside.toFixed(0) + "%" : "—"}
                    </span></div>
                  </div>
                  {t && !t.priv && <div className="lib-card-spark"><Sparkline data={priceSeries(t, "1M")} positive={positive} w={240} h={36}/></div>}
                </div>
                <div className="lib-card-foot">
                  <span className="muted num" style={{ fontSize: 11 }}>{c.updated}</span>
                  <span className="muted" style={{ fontSize: 11 }}>{c.author}</span>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

function Filter({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="library-filter">
      <span className="muted" style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
      </select>
    </div>
  );
}

/** Die gefilterte Liste als CSV herunterladen — Semikolon, damit Excel in DE sie direkt öffnet. */
function exportCsv(rows: LibraryCase[]) {
  const head = ["Company", "Ticker", "Sector", "Currency", "Scenario", "Status", "Author", "Updated"];
  const esc = (v: unknown) => {
    const t = String(v ?? "");
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const lines = [head, ...rows.map((c) => [c.name, c.ticker, c.sector, c.ccy, c.scenario, c.status, c.author, c.updated])]
    .map((r) => r.map(esc).join(";"));
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dealdesk-cases.csv";
  a.click();
  URL.revokeObjectURL(url);
}
