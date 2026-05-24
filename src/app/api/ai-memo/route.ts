import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type MemoResult = {
  recommendation: string;
  summary: string;
  thesis: string[];
  risks: string[];
  deckOutline: string[];
  source: "openai" | "fallback";
};

function cleanJson(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").slice(0, 6);
}

function fallbackMemo(body: any): MemoResult {
  const company = body.company || {};
  const outputs = body.outputs || {};
  const currency = company.currency || "EUR";
  const blendedSharePrice = Number(outputs.blendedSharePrice || 0).toFixed(2);
  const medianEvEbitda = Number(outputs.medianEvEbitda || 0).toFixed(1);
  const terminalShare = Number(outputs.terminalShare || 0).toFixed(0);

  return {
    recommendation: "Review / diligence required",
    summary: `${company.name || "The company"} screens as a finance case with an implied blended share price of ${currency} ${blendedSharePrice}. The valuation is supported by DCF and trading comps, but the case remains sensitive to terminal value, peer selection, growth and margin assumptions.`,
    thesis: [
      `Relevant exposure to ${company.sector || "the target sector"}.`,
      `Peer median EV/EBITDA of ${medianEvEbitda}x provides a benchmark for triangulation.`,
      "Forecast model creates a transparent bridge from revenue growth to free cash flow.",
      "Football field and sensitivity views support a range-based valuation discussion.",
    ],
    risks: [
      `Terminal value represents approximately ${terminalShare}% of DCF enterprise value.`,
      "Forecast assumptions require validation against historical performance and guidance.",
      "Peer group comparability may be limited by business model, geography or scale.",
      "No source-backed financial statement extraction has been performed yet.",
    ],
    deckOutline: [
      "Company profile and transaction context",
      "Historical and forecast financial model summary",
      "Peer group selection and trading comps",
      "DCF, sensitivity and football field valuation",
      "Investment thesis, risks and diligence questions",
    ],
    source: "fallback",
  };
}

function validateMemo(data: unknown): MemoResult {
  const value = data as Partial<MemoResult>;

  return {
    recommendation: typeof value.recommendation === "string" ? value.recommendation : "Review",
    summary: typeof value.summary === "string" ? value.summary : "No summary returned.",
    thesis: toStringArray(value.thesis),
    risks: toStringArray(value.risks),
    deckOutline: toStringArray(value.deckOutline),
    source: "openai",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ memo: fallbackMemo(body) });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-5-nano",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
You are a finance analyst drafting a concise investment memo from a valuation model.
Use only the provided data. Do not invent market facts or historical figures.
If data is missing, flag it as a diligence item.

Case JSON:
${JSON.stringify(body)}

Return only valid JSON:
{
  "recommendation": "Review / Buy / Hold / Avoid / Diligence required",
  "summary": "4-6 sentence investment summary",
  "thesis": ["Thesis point 1", "Thesis point 2", "Thesis point 3"],
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "deckOutline": ["Slide 1", "Slide 2", "Slide 3", "Slide 4", "Slide 5"]
}
              `.trim(),
            },
          ],
        },
      ],
    });

    return NextResponse.json({ memo: validateMemo(JSON.parse(cleanJson(response.output_text))) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI memo generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
