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
};

export function MemoPanel({
  company, scenario, dcf, terminalShare,
  blendedEv, blendedShare, aiMemo, onGenerate, generating, ccy,
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
            : <><Ico.sparkle/> Regenerate AI memo</>}
        </button>
      </div>
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
    </section>
  );
}
