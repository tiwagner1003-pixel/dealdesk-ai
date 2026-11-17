import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

type MemoResult = {
  recommendation: string;
  summary: string;
  thesis: string[];
  risks: string[];
  deckOutline: string[];
  source: "claude" | "fallback";
};

function cleanJson(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function toStringArray(value: unknown, max = 6): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").slice(0, max);
}

function fallbackMemo(body: Record<string, unknown>): MemoResult {
  const company = (body.company as Record<string, string>) || {};
  const outputs = (body.outputs as Record<string, number>) || {};
  const forecast = (body.forecast as { year: number; revenueGrowth: number; ebitdaMargin: number }[]) || [];
  const ccy = company.currency || "EUR";
  const blendedShare = Number(outputs.blendedSharePrice || 0).toFixed(2);
  const evEbitda = Number(outputs.medianEvEbitda || 0).toFixed(1);
  const termShare = Number(outputs.terminalShare || 0).toFixed(0);
  const year5Margin = forecast[4]?.ebitdaMargin?.toFixed(1) ?? "n/a";

  return {
    recommendation: "Diligence required",
    summary: `The model implies a blended share price of ${ccy} ${blendedShare} for ${company.name || "the company"}. The result is sensitive to terminal value (${termShare}% of DCF EV), peer selection and whether the Year 5 EBITDA margin of ${year5Margin}% is achievable.`,
    thesis: [
      `Relevant sector exposure in ${company.sector || "the target sector"} with identifiable growth levers.`,
      `Peer median EV/EBITDA of ${evEbitda}x supports the blended valuation range.`,
      "DCF and comps within the same order of magnitude — triangulation is defensible.",
      "Transparent financial model with a clear bridge from revenue to free cash flow.",
    ],
    risks: [
      `Terminal value represents ${termShare}% of DCF EV — high sensitivity to WACC and growth assumptions.`,
      "Forecast margin expansion requires operational validation; check against peer trajectory.",
      "Peer group comparability may be limited by geography, business model or scale.",
      "No third-party financial data extracted yet — all inputs are model assumptions.",
    ],
    deckOutline: [
      "1. Transaction overview and company profile",
      "2. Historical financials and management track record",
      "3. Forecast model and key assumptions bridge",
      "4. Valuation: DCF, trading comps and football field",
      "5. Investment thesis, key risks and diligence work-plan",
    ],
    source: "fallback",
  };
}

function validateMemo(data: unknown): MemoResult {
  const v = data as Partial<MemoResult>;
  return {
    recommendation: typeof v.recommendation === "string" ? v.recommendation : "Review",
    summary: typeof v.summary === "string" ? v.summary : "No summary returned.",
    thesis: toStringArray(v.thesis),
    risks: toStringArray(v.risks),
    deckOutline: toStringArray(v.deckOutline),
    source: "claude",
  };
}

function buildMemoPrompt(body: Record<string, unknown>): string {
  const company = (body.company as Record<string, string>) || {};
  const model = (body.model as Record<string, number>) || {};
  const forecast = (body.forecast as { year: number; revenueGrowth: number; ebitdaMargin: number }[]) || [];
  const peers = (body.peers as { name: string; ticker: string; revenueGrowth: number; ebitdaMargin: number; evRevenue: number; evEbitda: number; included?: boolean }[]) || [];
  const outputs = (body.outputs as Record<string, number>) || {};
  const scenario = (body.scenario as string) || "base";
  const ccy = company.currency || "USD";

  const peerSummary = peers
    .filter((p) => p.included !== false)
    .map((p) => `  ${p.name} (${p.ticker}): Rev growth ${p.revenueGrowth}%, EBITDA margin ${p.ebitdaMargin}%, EV/Rev ${p.evRevenue}x, EV/EBITDA ${p.evEbitda}x`)
    .join("\n") || "  No peers configured";

  const forecastSummary = forecast
    .map((f) => `  Year ${f.year}: Revenue growth ${f.revenueGrowth}%, EBITDA margin ${f.ebitdaMargin}%`)
    .join("\n") || "  No forecast configured";

  return `You are a senior investment banking analyst writing a structured Investment Committee memo for ${company.name || "the target company"}.

DEAL DATA:
Company: ${company.name} (${company.ticker}) | ${company.sector} | ${company.region} | ${ccy}
Scenario: ${scenario}
Base revenue: ${ccy} ${((model.revenue || 0) / 1000).toFixed(1)}B
WACC: ${model.wacc ?? "n/a"}% | Terminal growth: ${model.terminalGrowth ?? "n/a"}% | Exit multiple: ${model.exitMultiple ?? "n/a"}x
Net debt: ${ccy} ${((model.netDebt || 0) / 1000).toFixed(1)}B | Shares: ${model.shares ?? "n/a"}M

VALUATION OUTPUTS:
DCF EV: ${ccy} ${((outputs.dcfEnterpriseValue || 0) / 1000).toFixed(1)}B
Blended EV: ${ccy} ${((outputs.blendedEnterpriseValue || 0) / 1000).toFixed(1)}B
Blended equity value: ${ccy} ${((outputs.blendedEquityValue || 0) / 1000).toFixed(1)}B
Implied share price: ${ccy} ${(outputs.blendedSharePrice || 0).toFixed(2)}
Terminal value share: ${(outputs.terminalShare || 0).toFixed(0)}%
Peer median EV/Revenue: ${(outputs.medianEvRevenue || 0).toFixed(1)}x | EV/EBITDA: ${(outputs.medianEvEbitda || 0).toFixed(1)}x

5-YEAR FORECAST:
${forecastSummary}

PEER SET:
${peerSummary}

Write a concise Investment Committee memo using ONLY the data above. Do not invent market facts, historical context, or financial figures that were not provided. Where data is missing, flag it as a diligence question.

Return ONLY valid JSON (no markdown, no explanation):
{
  "recommendation": "Buy / Hold / Avoid / Diligence required",
  "summary": "4-6 sentence investment summary referencing the specific numbers above",
  "thesis": [
    "Quantitative thesis point citing specific model numbers",
    "Second thesis point",
    "Third thesis point"
  ],
  "risks": [
    "Specific quantified risk (e.g. terminal value is X% of EV)",
    "Second risk with specific number or assumption flagged",
    "Third risk"
  ],
  "deckOutline": [
    "Slide 1 title",
    "Slide 2 title",
    "Slide 3 title",
    "Slide 4 title",
    "Slide 5 title"
  ]
}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ memo: fallbackMemo(body) });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: buildMemoPrompt(body) }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(cleanJson(raw));
    return NextResponse.json({ memo: validateMemo(parsed) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI memo generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
