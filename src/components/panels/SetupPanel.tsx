"use client";

import type { CompanyInput, DataSourceNote, Scenario, MarketData } from "@/lib/types";

function MarketDataCard({ data }: { data: MarketData }) {
  const fmt = (n: number | null, decimals = 2) =>
    n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  const fmtB = (n: number | null) => {
    if (n == null) return "—";
    return n >= 1e12 ? `${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(0)}M` : n.toFixed(0);
  };
  const range52Pct = data.week52High > 0 && data.week52Low < data.week52High
    ? Math.round(((data.price - data.week52Low) / (data.week52High - data.week52Low)) * 100)
    : 50;
  const vs52wColor = data.priceVs52wHigh < -20 ? "var(--red, #dc2626)" : data.priceVs52wHigh > -5 ? "var(--green)" : "var(--muted)";

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Live price · {data.currency}</span>
          <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, marginTop: 2 }}>
            {data.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className="tag" style={{ color: vs52wColor, fontWeight: 600 }}>
            {data.priceVs52wHigh >= 0 ? "+" : ""}{data.priceVs52wHigh.toFixed(1)}% vs 52W high
          </span>
          <span className="muted" style={{ fontSize: 11 }}>
            Day: {fmt(data.dayLow)} – {fmt(data.dayHigh)}
          </span>
        </div>
      </div>

      {(data.marketCap != null || data.impliedEv != null) && (
        <div className="field-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          <div className="field">
            <label>Market Cap (live)</label>
            <span className="num" style={{ fontWeight: 600 }}>{data.currency} {fmtB(data.marketCap)}</span>
          </div>
          <div className="field">
            <label>Implied EV</label>
            <span className="num" style={{ fontWeight: 600 }}>{data.impliedEv != null ? `${data.currency} ${fmtB(data.impliedEv)}` : "—"}</span>
          </div>
          <div className="field">
            <label>Live EV / EBITDA</label>
            <span className="num" style={{ fontWeight: 600 }}>{data.impliedEvEbitda != null ? `${data.impliedEvEbitda.toFixed(1)}x` : "—"}</span>
          </div>
          <div className="field">
            <label>Live EV / Revenue</label>
            <span className="num" style={{ fontWeight: 600 }}>{data.impliedEvRevenue != null ? `${data.impliedEvRevenue.toFixed(1)}x` : "—"}</span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
          <span>{data.currency} {fmt(data.week52Low)}</span>
          <span style={{ fontWeight: 600 }}>52-week range · {range52Pct}th percentile</span>
          <span>{data.currency} {fmt(data.week52High)}</span>
        </div>
        <div style={{ position: "relative", height: 6, background: "var(--line)", borderRadius: 3 }}>
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: `${Math.min(100, Math.max(0, range52Pct))}%`,
            height: "100%", background: "var(--blue)", borderRadius: 3,
          }} />
        </div>
      </div>

      <span className="muted" style={{ fontSize: 11 }}>
        Yahoo Finance · {new Date(data.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        {data.impliedEv != null && " · EV & multiples computed from model shares + net debt"}
      </span>
    </div>
  );
}

type Props = {
  company: CompanyInput;
  onCompany: (field: keyof CompanyInput, value: string) => void;
  scenario: Scenario;
  onScenario: (s: Scenario) => void;
  sources: DataSourceNote[];
  onFetchSecData: () => void;
  secLoading: boolean;
  marketData?: MarketData | null;
  onFetchMarketData: () => void;
  marketLoading: boolean;
  onNext: () => void;
};

export function SetupPanel({
  company,
  onCompany,
  scenario,
  onScenario,
  sources,
  onFetchSecData,
  secLoading,
  marketData,
  onFetchMarketData,
  marketLoading,
  onNext,
}: Props) {
  const isPrivate = company.ticker === "PRIVATE" || company.exchange === "Private";

  return (
    <section className="panel">
      <div className="panel-head">
        <div className="head-title">
          <span className="eyebrow">Workflow · Step 01</span>
          <h2>Case setup</h2>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn" onClick={onFetchSecData} disabled={secLoading}>
            {secLoading ? "Fetching SEC..." : "Fetch SEC data"}
          </button>
          {!isPrivate && (
            <button className="btn primary" onClick={onFetchMarketData} disabled={marketLoading}>
              {marketLoading ? "Fetching..." : marketData ? "Refresh price" : "Fetch market data"}
            </button>
          )}
          <span className="head-aux">Set investment-case context</span>
        </div>
      </div>
      <div className="panel-body">
        <div className="field-grid" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
          <div className="field">
            <label>Company</label>
            <div className="input-wrap">
              <input className="text" value={company.name} onChange={(e) => onCompany("name", e.target.value)}/>
            </div>
          </div>
          <div className="field">
            <label>Ticker</label>
            <div className="input-wrap">
              <input value={company.ticker} onChange={(e) => onCompany("ticker", e.target.value.toUpperCase())}/>
            </div>
          </div>
          <div className="field">
            <label>Sector</label>
            <div className="input-wrap">
              <input className="text" value={company.sector} onChange={(e) => onCompany("sector", e.target.value)}/>
            </div>
          </div>
          <div className="field">
            <label>Region</label>
            <div className="input-wrap">
              <input className="text" value={company.region} onChange={(e) => onCompany("region", e.target.value)}/>
            </div>
          </div>
          <div className="field">
            <label>Currency</label>
            <div className="input-wrap">
              <input value={company.currency} onChange={(e) => onCompany("currency", e.target.value.toUpperCase())}/>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 18, padding: 16,
          border: "1px solid var(--line)", borderRadius: 6,
          background: "var(--panel-soft)",
          display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 16, alignItems: "center"
        }}>
          <div>
            <span className="eyebrow">Scenario</span>
            <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 600 }}>Valuation case</h3>
          </div>
          <div className="segmented" style={{ justifySelf: "start" }}>
            {(["downside", "base", "upside"] as Scenario[]).map((s) => (
              <button key={s} className={scenario === s ? "active" : ""} onClick={() => onScenario(s)}>
                {s}
              </button>
            ))}
          </div>
          <span className="head-aux">Affects growth & margin overlay</span>
        </div>

        {marketData && (
          <div style={{
            marginTop: 18, padding: 16,
            border: "1px solid var(--blue)",
            borderRadius: 6,
            background: "var(--blue-soft)",
          }}>
            <div style={{ marginBottom: 12 }}>
              <span className="eyebrow">Market data · {marketData.name}</span>
            </div>
            <MarketDataCard data={marketData} />
          </div>
        )}

        <div style={{
          marginTop: 18,
          padding: 16,
          border: "1px solid var(--line)",
          borderRadius: 6,
          background: "var(--panel-soft)",
          display: "grid",
          gap: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <span className="eyebrow">Data sources</span>
              <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 600 }}>Source trail</h3>
            </div>
            <span className="head-aux">Every imported value should point back to a source</span>
          </div>
          {sources.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Current case uses demo/manual values. Fetch SEC data for US-listed tickers or import Excel/PDF to add source notes.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {sources.map((source, index) => (
                <div
                  key={`${source.provider}-${source.updatedAt}-${index}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 6,
                    padding: "10px 12px",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    background: "var(--panel)",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{source.provider} · {source.label}</span>
                  <span className="tag">{source.confidence}</span>
                  <span className="muted num" style={{ fontSize: 11.5 }}>
                    {[source.form, source.fiscalYear ? `FY${source.fiscalYear}` : null].filter(Boolean).join(" · ") || "Source note"}
                  </span>
                  {source.url && (
                    <a className="muted" href={source.url} target="_blank" rel="noreferrer" style={{ fontSize: 11.5 }}>
                      Open source
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 0 4px" }}>
        <button className="btn primary" onClick={onNext}>
          Next: Model →
        </button>
      </div>
    </section>
  );
}
