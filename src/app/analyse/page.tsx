"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { AnalysisResult } from "@/app/api/analyse-doc/route";

const TONE_COLOR: Record<string, string> = {
  positive: "var(--green, #16a34a)",
  neutral:  "var(--muted)",
  cautious: "var(--gold, #d97706)",
  unknown:  "var(--muted)",
};

const TONE_LABEL: Record<string, string> = {
  positive: "Positiv",
  neutral:  "Neutral",
  cautious: "Zurückhaltend",
  unknown:  "—",
};

function fmt(n: number | null, suffix = "") {
  if (n == null) return "—";
  const abs = Math.abs(n);
  const formatted = abs >= 1000 ? `${(abs / 1000).toFixed(1)}B` : `${Math.round(abs)}M`;
  return `${n < 0 ? "-" : ""}${formatted}${suffix}`;
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      padding: "14px 16px", border: "1px solid var(--line)",
      borderRadius: 8, background: "var(--panel)",
    }}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function DropZone({ onFile, loading }: { onFile: (f: File) => void; loading: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onClick={() => !loading && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      style={{
        border: `2px dashed ${dragging ? "var(--blue)" : "var(--line)"}`,
        borderRadius: 12, padding: "48px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
        cursor: loading ? "default" : "pointer",
        background: dragging ? "var(--blue-soft)" : "var(--panel-soft)",
        transition: "all 0.15s", textAlign: "center",
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ""; }}
      />
      {loading ? (
        <>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: "3px solid var(--blue)", borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}/>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Claude analysiert…</div>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Das kann 15–30 Sekunden dauern</div>
          </div>
        </>
      ) : (
        <>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: "var(--blue-soft)", display: "grid", placeItems: "center",
          }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M5 5h10l6 6v11a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" stroke="var(--blue)" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M15 5v6h6M9 14h8M9 17h5" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>PDF hier ablegen oder klicken</div>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
              Geschäftsbericht · SEC Filing · Earnings Report · max. 20 MB
            </div>
          </div>
          <div style={{
            fontSize: 12, color: "var(--blue)", fontWeight: 500,
            padding: "6px 16px", borderRadius: 6, border: "1px solid var(--blue)",
          }}>Datei auswählen</div>
        </>
      )}
    </div>
  );
}

export default function AnalysePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("");

  async function handleFile(file: File) {
    setLoading(true);
    setError("");
    setResult(null);
    setFilename(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/analyse-doc", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyse fehlgeschlagen");
      setResult(data.result as AnalysisResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  function buildModelUrl() {
    if (!result) return "/model";
    const p = new URLSearchParams();
    if (result.company.name)    p.set("name", result.company.name);
    if (result.company.ticker)  p.set("ticker", result.company.ticker);
    if (result.company.sector)  p.set("sector", result.company.sector);
    if (result.company.region)  p.set("region", result.company.region);
    if (result.company.currency) p.set("currency", result.company.currency);
    if (result.financials.revenue != null) p.set("revenue", String(result.financials.revenue));
    if (result.financials.netDebt != null) p.set("netDebt", String(result.financials.netDebt));
    if (result.financials.sharesOutstanding != null) p.set("shares", String(result.financials.sharesOutstanding));
    if (result.financials.ebitdaMargin != null) p.set("ebitdaMargin", String(result.financials.ebitdaMargin));
    return `/model?${p.toString()}`;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <header style={{
        height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", borderBottom: "1px solid var(--line)",
        background: "var(--panel)", position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--muted)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 13 }}>Home</span>
          </Link>
          <span style={{ color: "var(--line)" }}>·</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 26, height: 26, borderRadius: 6,
              background: "var(--navy)", color: "#fff",
              display: "grid", placeItems: "center",
              fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700,
            }}>D</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Analyse</span>
          </div>
        </div>
        {result && (
          <Link href={buildModelUrl()} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--navy)", color: "white",
            padding: "7px 16px", borderRadius: 6,
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            Im Modell öffnen →
          </Link>
        )}
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>

        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Modul 01
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 8px" }}>
            Dokument analysieren
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
            Lade einen Geschäftsbericht oder ein SEC Filing hoch. Claude extrahiert automatisch alle relevanten Finanzkennzahlen, Risiken und Kernaussagen.
          </p>
        </div>

        <DropZone onFile={handleFile} loading={loading} />

        {error && (
          <div style={{
            marginTop: 16, padding: "12px 16px",
            background: "#fee2e2", border: "1px solid #fca5a5",
            borderRadius: 8, color: "#dc2626", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 32, display: "grid", gap: 20 }}>

            {/* Company header */}
            <div style={{
              padding: 24, border: "1px solid var(--line)",
              borderRadius: 10, background: "var(--panel)",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 10.5, padding: "2px 8px", borderRadius: 4,
                    background: "var(--blue-soft)", color: "var(--blue)",
                    fontWeight: 600, fontFamily: "var(--font-mono)",
                  }}>{result.documentType}</span>
                  <span style={{
                    fontSize: 10.5, padding: "2px 8px", borderRadius: 4,
                    background: "var(--panel-soft)", border: "1px solid var(--line)",
                    color: "var(--muted)", fontFamily: "var(--font-mono)",
                  }}>{result.company.fiscalYear}</span>
                  <span style={{
                    fontSize: 10.5, padding: "2px 8px", borderRadius: 4,
                    background: "var(--panel-soft)", border: "1px solid var(--line)",
                    color: "var(--muted)", fontFamily: "var(--font-mono)",
                  }}>Konfidenz: {result.confidence}</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                  {result.company.name || filename}
                </h2>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 13, color: "var(--muted)" }}>
                  {result.company.ticker && <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{result.company.ticker}</span>}
                  {result.company.sector && <span>{result.company.sector}</span>}
                  {result.company.region && <span>{result.company.region}</span>}
                  {result.company.currency && <span>{result.company.currency}</span>}
                </div>
              </div>
              <div style={{ display: "flex", flex: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Management-Ton</div>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: TONE_COLOR[result.managementTone] || "var(--muted)",
                }}>
                  {TONE_LABEL[result.managementTone] || "—"}
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div>
              <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Finanzkennzahlen · {result.company.currency}
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginTop: 10 }}>
                <KpiCard label="Umsatz" value={fmt(result.financials.revenue, "m")}
                  sub={result.financials.revenueGrowthYoy != null ? `YoY: ${result.financials.revenueGrowthYoy > 0 ? "+" : ""}${result.financials.revenueGrowthYoy.toFixed(1)}%` : undefined}/>
                <KpiCard label="EBITDA" value={fmt(result.financials.ebitda, "m")}
                  sub={result.financials.ebitdaMargin != null ? `Marge: ${result.financials.ebitdaMargin.toFixed(1)}%` : undefined}/>
                <KpiCard label="Net Income" value={fmt(result.financials.netIncome, "m")}/>
                <KpiCard label="Free Cash Flow" value={fmt(result.financials.freeCashFlow, "m")}/>
                <KpiCard label="Net Debt" value={fmt(result.financials.netDebt, "m")}
                  sub={result.financials.netDebt != null && result.financials.netDebt < 0 ? "Net Cash" : undefined}/>
                <KpiCard label="Aktien (Mio.)" value={result.financials.sharesOutstanding != null ? result.financials.sharesOutstanding.toFixed(0) : "—"}/>
              </div>
            </div>

            {/* Guidance */}
            {result.guidance && (
              <div style={{
                padding: "14px 18px", border: "1px solid var(--blue)",
                borderRadius: 8, background: "var(--blue-soft)",
                fontSize: 13, color: "var(--blue)", lineHeight: 1.6,
              }}>
                <span style={{ fontWeight: 600 }}>Guidance: </span>{result.guidance}
              </div>
            )}

            {/* Thesis & Risks */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ padding: 20, border: "1px solid var(--line)", borderRadius: 10, background: "var(--panel)" }}>
                <h4 style={{ color: "var(--blue)", margin: "0 0 12px", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Investment-Thesis
                </h4>
                {result.thesis.length > 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                    {result.thesis.map((t, i) => (
                      <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                        <span style={{ color: "var(--blue)", flexShrink: 0, marginTop: 2 }}>+</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Keine Thesen identifiziert</p>}
              </div>
              <div style={{ padding: 20, border: "1px solid var(--line)", borderRadius: 10, background: "var(--panel)" }}>
                <h4 style={{ color: "var(--gold, #d97706)", margin: "0 0 12px", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Risiken
                </h4>
                {result.risks.length > 0 ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                    {result.risks.map((r, i) => (
                      <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                        <span style={{ color: "var(--gold, #d97706)", flexShrink: 0, marginTop: 2 }}>!</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Keine Risiken identifiziert</p>}
              </div>
            </div>

            {/* Notes */}
            {result.rawNotes && (
              <div style={{ fontSize: 12.5, color: "var(--muted)", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 6 }}>
                <strong>Hinweise: </strong>{result.rawNotes}
              </div>
            )}

            {/* CTA */}
            <div style={{
              padding: 24, border: "1px solid var(--navy)",
              borderRadius: 10, background: "var(--navy)",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
            }}>
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                  Weiter zum Modell
                </div>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                  Alle extrahierten Kennzahlen werden als neuer Case vorausgefüllt
                </div>
              </div>
              <Link href={buildModelUrl()} style={{
                background: "white", color: "var(--navy)",
                padding: "10px 22px", borderRadius: 7,
                fontSize: 13.5, fontWeight: 700, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                Im Modell öffnen →
              </Link>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
