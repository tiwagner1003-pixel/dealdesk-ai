"use client";

import Link from "next/link";

function NavBar() {
  return (
    <header style={{
      height: 52, display: "flex", alignItems: "center",
      padding: "0 32px", borderBottom: "1px solid var(--line)",
      background: "var(--panel)", position: "sticky", top: 0, zIndex: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          width: 26, height: 26, borderRadius: 6,
          background: "var(--navy)", color: "#fff",
          display: "grid", placeItems: "center",
          fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, lineHeight: 1,
        }}>D</span>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>DealDesk AI</span>
        <span style={{
          fontSize: 10.5, color: "var(--muted)", fontFamily: "var(--font-mono)",
          padding: "2px 6px", border: "1px solid var(--line)", borderRadius: 3,
          textTransform: "uppercase", letterSpacing: "0.04em",
        }}>Beta</span>
      </div>
    </header>
  );
}

function ModuleCard({
  href, eyebrow, title, description, badge, accent, items,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  accent: string;
  items: string[];
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        border: "1px solid var(--line)", borderRadius: 12,
        padding: 32, background: "var(--panel)",
        display: "flex", flexDirection: "column", gap: 20,
        height: "100%", cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = accent;
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px ${accent}22, 0 8px 32px ${accent}18`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--line)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: accent + "18", border: `1px solid ${accent}30`,
            display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            {href === "/analyse" ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 4h9l5 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke={accent} strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M13 4v5h5M7 12h8M7 15h5" stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="14" width="4" height="6" rx="1" fill={accent} opacity="0.5"/>
                <rect x="9" y="9" width="4" height="11" rx="1" fill={accent} opacity="0.7"/>
                <rect x="16" y="4" width="4" height="16" rx="1" fill={accent}/>
                <path d="M3 12 9 7l4 3 6-6" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          {badge && (
            <span style={{
              fontSize: 10.5, fontWeight: 600, padding: "3px 8px",
              borderRadius: 20, background: accent + "18", color: accent,
              fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
            }}>{badge}</span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {eyebrow}
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, color: "var(--text)" }}>
            {title}
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
            {description}
          </p>
        </div>

        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {items.map((item, i) => (
            <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)" }}>
              <span style={{
                width: 16, height: 16, borderRadius: "50%",
                background: accent + "20", display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l2 2L6.5 2" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div style={{
          marginTop: "auto", paddingTop: 16,
          borderTop: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>Öffnen</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <NavBar />

      <main style={{ flex: 1, maxWidth: 960, margin: "0 auto", padding: "64px 24px", width: "100%" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <span style={{
            display: "inline-block", fontSize: 11, fontWeight: 600,
            fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--blue)",
            background: "var(--blue-soft)", padding: "4px 12px",
            borderRadius: 20, marginBottom: 20,
          }}>
            AI-powered · IB Workbench
          </span>
          <h1 style={{
            fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800,
            letterSpacing: "-0.03em", lineHeight: 1.1,
            margin: "0 0 20px", color: "var(--text)",
          }}>
            Von Geschäftsbericht<br/>
            <span style={{ color: "var(--blue)" }}>zum IC-Memo</span>
          </h1>
          <p style={{
            fontSize: 17, color: "var(--muted)", lineHeight: 1.7,
            maxWidth: 520, margin: "0 auto",
          }}>
            Dokumente analysieren, Modelle bauen, Bewertungen generieren —
            in einem Workflow, ohne Bloomberg.
          </p>
        </div>

        {/* Module Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          <ModuleCard
            href="/analyse"
            eyebrow="Modul 01"
            title="Analyse"
            description="Lade Geschäftsberichte, SEC Filings oder Earnings-Transkripte hoch. Claude extrahiert automatisch KPIs, Risiken und Kerninformationen."
            badge="Claude AI"
            accent="#3b82f6"
            items={[
              "PDF-Upload & automatische KPI-Extraktion",
              "Risiken, Chancen und Management-Ton",
              "Direkt ins Modell übernehmen",
            ]}
          />
          <ModuleCard
            href="/model"
            eyebrow="Modul 02"
            title="Model"
            description="Professionelles Bewertungs-Workbench mit DCF, Trading Comps und KI-generiertem IC-Memo — exportierbar als PPT und Excel."
            accent="#0f172a"
            items={[
              "DCF-Modell mit 3-Szenario-Analyse",
              "Peer-Vergleich & Football Field",
              "AI-Memo + PPT/Excel Export",
            ]}
          />
        </div>

        {/* Bottom hint */}
        <div style={{ marginTop: 48, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Neu hier? Starte mit <strong>Analyse</strong> — lade einen Geschäftsbericht hoch und übernimm die Zahlen direkt ins Modell.
          </p>
        </div>
      </main>
    </div>
  );
}
