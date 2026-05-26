import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export type AnalysisResult = {
  company: {
    name: string;
    ticker: string;
    sector: string;
    region: string;
    currency: string;
    fiscalYear: string;
  };
  financials: {
    revenue: number | null;
    ebitda: number | null;
    ebitdaMargin: number | null;
    netIncome: number | null;
    freeCashFlow: number | null;
    netDebt: number | null;
    sharesOutstanding: number | null;
    revenueGrowthYoy: number | null;
  };
  guidance: string | null;
  thesis: string[];
  risks: string[];
  managementTone: "positive" | "neutral" | "cautious" | "unknown";
  documentType: string;
  confidence: "high" | "medium" | "low";
  rawNotes: string;
};

function fallbackResult(filename: string): AnalysisResult {
  return {
    company: { name: "", ticker: "", sector: "", region: "", currency: "EUR", fiscalYear: "" },
    financials: {
      revenue: null, ebitda: null, ebitdaMargin: null,
      netIncome: null, freeCashFlow: null, netDebt: null,
      sharesOutstanding: null, revenueGrowthYoy: null,
    },
    guidance: null,
    thesis: [],
    risks: [],
    managementTone: "unknown",
    documentType: filename,
    confidence: "low",
    rawNotes: "Add ANTHROPIC_API_KEY to .env.local to enable document analysis.",
  };
}

const SYSTEM_PROMPT = `You are a senior investment banking analyst. Extract structured financial data from the provided document.
Be precise with numbers — only report figures explicitly stated in the document. Use null for anything not found.
All monetary values should be in the document's stated currency, in millions (e.g. €1.2B = 1200, €500M = 500).
Return only valid JSON, no markdown, no explanation.`;

const USER_PROMPT = `Analyze this financial document and extract all available information.

Return this exact JSON structure:
{
  "company": {
    "name": "Full legal company name",
    "ticker": "Stock ticker or empty string",
    "sector": "Industry/sector description",
    "region": "Country or region",
    "currency": "3-letter currency code (EUR, USD, GBP etc)",
    "fiscalYear": "Fiscal year e.g. FY2024 or Q3 2024"
  },
  "financials": {
    "revenue": <number in millions or null>,
    "ebitda": <number in millions or null>,
    "ebitdaMargin": <percentage number e.g. 24.5 or null>,
    "netIncome": <number in millions or null>,
    "freeCashFlow": <number in millions or null>,
    "netDebt": <number in millions, negative if net cash, or null>,
    "sharesOutstanding": <number in millions or null>,
    "revenueGrowthYoy": <percentage number e.g. 12.3 or null>
  },
  "guidance": "Company guidance for next period as a short string, or null",
  "thesis": [
    "Key investment thesis point 1 — specific to this company and document",
    "Key thesis point 2",
    "Key thesis point 3"
  ],
  "risks": [
    "Key risk 1 — specific and quantified where possible",
    "Key risk 2",
    "Key risk 3"
  ],
  "managementTone": "positive" or "neutral" or "cautious",
  "documentType": "Annual Report / Quarterly Earnings / Investor Presentation / etc",
  "confidence": "high" or "medium" or "low",
  "rawNotes": "Any important context, caveats or data quality notes in 1-2 sentences"
}`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      const filename = request.headers.get("x-filename") || "document.pdf";
      return NextResponse.json({ result: fallbackResult(filename) });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 20MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = file.type === "application/pdf" ? "application/pdf" : "application/pdf";

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: mediaType, data: base64 },
          } as Anthropic.DocumentBlockParam,
          { type: "text", text: USER_PROMPT },
        ],
      }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    const result = JSON.parse(cleaned) as AnalysisResult;

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
