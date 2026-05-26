"use client";

import { Ico } from "../icons";
import type { CompanyInput, Scenario, DcfOutput, AiMemo } from "@/lib/types";
import { formatMoney } from "@/lib/format";

type Props = {
  company: CompanyInput;
  scenario: Scenario;
  dcf: DcfOutput;
  terminalShare: number;
  blendedEv: number;
  blendedShare: number;
  aiMemo: AiMemo | null;
  onGenerate: () => void;
  generating: boolean;
  ccy: string;
  onExportPpt: () => void;
  onExportXls: () => void;
};

export function MemoPanel({
  company, scenario, dcf, terminalShare,
  blendedEv, blendedShare, aiMemo, onGenerate, generating, ccy,
  onExportPpt, onExportXls,
}: Props) {
  const thesis = aiMemo?.thesis || [
    "Single full-stack platform is a structural moat — competitors must rebuild rails and bank licenses across markets.",
    "Enterprise-merchant mix and platform-payments TAM expansion compound revenue growth through the forecast.",
    "Strong net-cash position funds buybacks or counter-cyclical M&A without dilution.",
  ];
  const risks = aiMemo?.risks || [
    `Terminal value represents ${terminalShare.toFixed(0)}% of DCF enterprise value — outcome highly sensitive to WACC and exit-multiple assumptions.`,
    "EU regulatory cycle (interchange caps, instant-payment scheme economics) could compress take-rate.",
    "Stablecoin and alt-rail competition emerging in B2B cross-border flows.",
  ];
  const summary = aiMemo?.summary || `${company.name} (${company.ticker}) is a ${company.region}-based ${company.sector} platform. Under the ${scenario} case, the blended valuation triangulates to ${formatMoney(blendedEv, ccy)} enterprise value, implying ${ccy} ${blendedShare.toFixed(2)} per share against a ${dcf.sharePrice.toFixed(2)} DCF-only fair value. Terminal-value contribution remains the dominant valuation lever.`;
  const deckOutline = aiMemo?.deckOutline || [];
  const isClaudeGenerated = aiMemo?.source === "claude";

  return (
    <section className="panel">
      <div className="panel-head">
        <div className="head-title">
          <span className="eyebrow">Workflow · Step 05 · Investment Memo</span>
          <h2>{company.name} — initial view</h2>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {aiMemo && (
            <span className="tag" style={{
              background: isClaudeGenerated ? "var(--blue-soft)" : "var(--panel-soft)",
              color: isClaudeGenerated ? "var(--blue)" : "var(--muted)",
              border: "none", fontSize: 11,
            }}>
              {isClaudeGenerated ? "✓ Claude · Sonnet 4.6" : "Fallback template"}
            </span>
          )}
          <button className="btn" onClick={onGenerate} disabled={generating}>
            {generating
              ? <><span className="spin">⟳</span> Generating…</>
              : <><Ico.sparkle/> {aiMemo ? "Regenerate" : "Generate AI memo"}</>}
          </button>
        </div>
      </div>

      {/* IC Package export banner — shown when memo is ready */}
      {aiMemo && (
        <div style={{
          margin: "0 0 2px",
          padding: "14px 20px",
          background: "var(--navy, #0f172a)",
          borderRadius: "6px 6px 0 0",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              IC Package ready
            </span>
            <div style={{ color: "white", fontWeight: 600, fontSize: 14, marginTop: 2 }}>
              {company.name} · {scenario.charAt(0).toUpperCase() + scenario.slice(1)} case · {ccy} {blendedShare.toFixed(2)} target
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onExportPpt}
              style={{
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                color: "white", borderRadius: 6, padding: "7px 14px",
                fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Ico.download/> PowerPoint
            </button>
            <button
              onClick={onExportXls}
              style={{
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                color: "white", borderRadius: 6, padding: "7px 14px",
                fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Ico.download/> Excel model
            </button>
          </div>
        </div>
      )}

      <div className="memo-headline">
        <div className="rec">
          <span className="pill">RECOMMENDATION</span>
          <span>{aiMemo?.recommendation || "BUY · Outperform"}</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            Target {ccy} {blendedShare.toFixed(2)}
          </span>
        </div>
        <p className="summary">{summary}</p>
      </div>

      <div className="memo-columns">
        <div className="col">
          <h4 style={{ color: "var(--blue)" }}>Investment thesis</h4>
          <ul>
            {thesis.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
        <div className="col">
          <h4 style={{ color: "var(--gold)" }}>Key risks</h4>
          <ul>
            {risks.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      </div>

      {deckOutline.length > 0 && (
        <div style={{
          marginTop: 16, padding: "14px 20px",
          border: "1px solid var(--line)", borderRadius: 6,
          background: "var(--panel-soft)",
        }}>
          <span className="eyebrow" style={{ marginBottom: 8, display: "block" }}>Suggested deck outline</span>
          <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
            {deckOutline.map((slide, i) => (
              <li key={i} style={{ fontSize: 13, color: "var(--text)" }}>{slide}</li>
            ))}
          </ol>
        </div>
      )}

      {!aiMemo && (
        <div style={{
          marginTop: 16, padding: 24,
          border: "2px dashed var(--line)", borderRadius: 6,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
        }}>
          <Ico.sparkle/>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Generate your IC memo with Claude</div>
            <div className="muted" style={{ fontSize: 13, maxWidth: 400 }}>
              Claude analyzes your model assumptions, peer benchmarks and valuation outputs to write a structured Investment Committee memo — thesis, risks, recommendation and deck outline.
            </div>
          </div>
          <button className="btn primary" onClick={onGenerate} disabled={generating} style={{ marginTop: 4 }}>
            {generating ? <><span className="spin">⟳</span> Generating…</> : <><Ico.sparkle/> Generate IC memo</>}
          </button>
        </div>
      )}
    </section>
  );
}
