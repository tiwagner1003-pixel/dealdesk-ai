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
  hasComps?: boolean;
  aiMemo: AiMemo | null;
  onGenerate: () => void;
  generating: boolean;
  ccy: string;
};

export function MemoPanel({
  company, scenario, dcf, terminalShare,
  blendedEv, blendedShare, hasComps = true, aiMemo, onGenerate, generating, ccy,
}: Props) {
  // Ohne erzeugtes Memo keine erfundene These — nur, was aus dem Modell folgt.
  const thesis = aiMemo?.thesis?.length ? aiMemo.thesis : [
    "Generate the memo to draft an investment thesis from the model inputs.",
  ];
  const risks = aiMemo?.risks?.length ? aiMemo.risks : [
    `Terminal value represents ${terminalShare.toFixed(0)}% of DCF enterprise value — outcome highly sensitive to WACC and exit-multiple assumptions.`,
  ];
  const summary = aiMemo?.summary || `${company.name} (${company.ticker}) is a ${company.region}-based ${company.sector} platform. Under the ${scenario} case, ${hasComps ? `the blended valuation triangulates to ${formatMoney(blendedEv, ccy)} enterprise value, implying ${ccy} ${blendedShare.toFixed(2)} per share against a ${dcf.sharePrice.toFixed(2)} DCF-only fair value.` : `the DCF alone points to ${formatMoney(blendedEv, ccy)} enterprise value and ${ccy} ${blendedShare.toFixed(2)} per share; no comparable peers are included to cross-check it.`} Terminal-value contribution remains the dominant valuation lever.`;

  return (
    <section className="panel">
      <div className="panel-head">
        <div className="head-title">
          <span className="eyebrow">Workflow · Step 05 · Investment Memo</span>
          <h2>{company.name} — initial view</h2>
        </div>
        <button className="btn primary" onClick={onGenerate} disabled={generating}>
          {generating
            ? <><span className="spin">⟳</span> Generating…</>
            : <><Ico.sparkle/> {aiMemo ? "Regenerate memo" : "Generate memo"}</>}
        </button>
      </div>
      <div className="memo-headline">
        <div className="rec">
          <span className="pill">RECOMMENDATION</span>
          <span>{aiMemo?.recommendation || "Not generated yet"}</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            Implied {ccy} {blendedShare.toFixed(2)}
          </span>
        </div>
        <p className="summary">{summary}</p>
        {aiMemo?.source === "fallback" && (
          <p className="memo-source">Rule-based draft from the model figures — no AI model is connected on this deployment.</p>
        )}
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
    </section>
  );
}
