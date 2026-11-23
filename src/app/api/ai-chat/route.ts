import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

type ChatBody = {
  message: string;
  company: {
    name: string;
    ticker: string;
    sector: string;
    region: string;
    currency: string;
  };
  kpis: {
    sharePrice: number;
    spot?: number;
    upside?: number;
    ev: number;
    equity?: number;
    terminal: number;
    evEbitda?: number;
    evRevenue?: number;
    dcfEv?: number;
    compsEv?: number;
  };
  model?: {
    revenue: number;
    wacc: number;
    terminalGrowth: number;
    exitMultiple: number;
    netDebt: number;
    shares: number;
    taxRate: number;
    capexPercent: number;
    depreciationPercent: number;
    nwcPercent: number;
  };
  forecast?: { year: number; revenueGrowth: number; ebitdaMargin: number }[];
  peers?: { name: string; ticker: string; revenueGrowth: number; ebitdaMargin: number; evRevenue: number; evEbitda: number }[];
  scenario?: string;
  history?: { role: "user" | "assistant"; body: string }[];
};

function buildSystemPrompt(body: ChatBody): string {
  const { company, kpis, model, forecast, peers, scenario } = body;
  const ccy = company.currency;
  const evB = (kpis.ev / 1000).toFixed(1);
  const dcfB = kpis.dcfEv ? (kpis.dcfEv / 1000).toFixed(1) : "n/a";
  const compsB = kpis.compsEv ? (kpis.compsEv / 1000).toFixed(1) : "n/a";

  const forecastLines = forecast
    ? forecast.map((f) => `  Year ${f.year}: Revenue growth ${f.revenueGrowth}%, EBITDA margin ${f.ebitdaMargin}%`).join("\n")
    : "  Not provided";

  const peerLines = peers
    ? peers.map((p) => `  ${p.name} (${p.ticker}): Rev growth ${p.revenueGrowth}%, EBITDA margin ${p.ebitdaMargin}%, EV/Rev ${p.evRevenue}x, EV/EBITDA ${p.evEbitda}x`).join("\n")
    : "  Not provided";

  return `You are an investment banking analyst co-pilot embedded in DealDesk AI, a professional valuation workbench.

Your job: Give sharp, specific, quantitative answers. Reference the actual numbers from the case. Think like a sell-side M&A analyst preparing a fairness opinion or a buy-side associate stress-testing a thesis.

CURRENT DEAL CASE:
- Company: ${company.name} (${company.ticker}) | ${company.sector} | ${company.region} | ${ccy}
- Scenario: ${scenario || "base"}
- Base revenue: ${ccy} ${model ? (model.revenue / 1000).toFixed(1) + "B" : "n/a"}
- WACC: ${model?.wacc ?? "n/a"}% | Terminal growth: ${model?.terminalGrowth ?? "n/a"}% | Exit multiple: ${model?.exitMultiple ?? "n/a"}x
- Net debt: ${model ? (model.netDebt / 1000).toFixed(1) + "B" : "n/a"} | Shares: ${model?.shares ?? "n/a"}M
- Tax rate: ${model?.taxRate ?? "n/a"}% | CapEx: ${model?.capexPercent ?? "n/a"}% of rev | D&A: ${model?.depreciationPercent ?? "n/a"}% of rev

VALUATION OUTPUTS:
- Blended EV: ${ccy} ${evB}B (DCF: ${dcfB}B | Comps: ${compsB}B)
- Blended equity value → implied share price: ${ccy} ${kpis.sharePrice.toFixed(2)}
${kpis.spot ? `- Current market price: ${ccy} ${kpis.spot.toFixed(2)} → implied upside/downside: ${kpis.upside?.toFixed(1)}%` : ""}
- Terminal value as % of DCF EV: ${kpis.terminal.toFixed(0)}%
- Peer median EV/Revenue: ${kpis.evRevenue ? `${kpis.evRevenue.toFixed(1)}x` : "n/a (no peers included, DCF only)"} | EV/EBITDA: ${kpis.evEbitda ? `${kpis.evEbitda.toFixed(1)}x` : "n/a"}

5-YEAR FORECAST:
${forecastLines}

PEER SET:
${peerLines}

RULES:
- Be concise: 3-6 sentences unless a calculation or list is needed
- Always cite the specific numbers from the case above
- If asked about scenarios, calculate the quantitative impact (e.g. "+50bps on WACC → share price -X%")
- If asked for a memo, tell them to use the Memo tab which generates a full structured IC memo
- Do not invent market data you haven't been given
- Flag assumptions that are aggressive or need diligence`;
}

/**
 * Regelantworten ohne Modell. Sie nennen nur Zahlen, die aus dem Fall kommen —
 * bis zum 23.11.2026 standen hier Faustwerte („±8–12 %“, „+15–20 %“), die wie
 * Modellergebnisse aussahen und keine waren.
 */
function fallbackReply(body: ChatBody): string {
  const msg = body.message.toLowerCase();
  const { company, kpis, model, forecast } = body;
  const ccy = company.currency;
  const bn = (v: number) => `${ccy} ${(v / 1000).toFixed(1)}B`;
  const tv = `Terminal value is ${kpis.terminal.toFixed(0)}% of DCF EV`;

  if (msg.includes("irr") || msg.includes("lbo") || msg.includes("sponsor") || msg.includes("leverage")) {
    return `The LBO tab values the same operating case from a sponsor's seat: entry and exit multiple, debt at a multiple of EBITDA, and a full cash sweep. Its sensitivity grid shows IRR against exit multiple and revenue growth, and the bridge splits the return into EBITDA growth, multiple change and deleveraging.`;
  }
  if (msg.includes("implied") && kpis.spot != null && kpis.upside != null) {
    return `Implied share price ${ccy} ${kpis.sharePrice.toFixed(2)} against a spot price of ${ccy} ${kpis.spot.toFixed(2)}: ${kpis.upside > 0 ? "+" : ""}${kpis.upside.toFixed(1)}%. ${tv}, so that gap moves quickly with WACC and terminal growth.`;
  }
  if (msg.includes("upside") || msg.includes("downside") || msg.includes("scenario")) {
    const f = forecast?.length ? forecast : null;
    const path = f ? ` In the base plan revenue growth runs from ${f[0].revenueGrowth.toFixed(1)}% to ${f[f.length - 1].revenueGrowth.toFixed(1)}% and the EBITDA margin from ${f[0].ebitdaMargin.toFixed(1)}% to ${f[f.length - 1].ebitdaMargin.toFixed(1)}%.` : "";
    return `Switch between Downside, Base and Upside above the valuation: the scenarios shift revenue growth and EBITDA margin, and every figure updates live.${path} Blended EV in this case: ${bn(kpis.ev)}.`;
  }
  if (msg.includes("wacc") || msg.includes("sensit") || msg.includes("drive") || msg.includes("stress")) {
    const at = model ? ` (currently WACC ${model.wacc.toFixed(1)}%, terminal growth ${model.terminalGrowth.toFixed(1)}%)` : "";
    return `${tv}, so WACC and terminal growth move the result most${at}. The WACC × terminal-growth grid on the Valuation tab shows the implied value for each pair; the margin path on the Model tab is the next lever.`;
  }
  if (msg.includes("peer") || msg.includes("comp") || msg.includes("multiple")) {
    if (!kpis.evEbitda) return `No comparable peers are included, so the valuation rests on the DCF alone. Add or include at least two peers from the same sector on the Peers tab to triangulate it.`;
    return `The peer median EV/EBITDA is ${kpis.evEbitda.toFixed(1)}x and EV/Revenue ${(kpis.evRevenue ?? 0).toFixed(1)}x. These comps anchor the trading range in the football field.`;
  }
  if (msg.includes("memo") || msg.includes("buy") || msg.includes("recommend") || msg.includes("risk")) {
    return `The Memo tab drafts thesis, risks and a deck outline from the model figures; export it to PowerPoint from there.`;
  }
  const price = kpis.spot != null ? ` → implied share price ${ccy} ${kpis.sharePrice.toFixed(2)}` : "";
  return `${company.name} blended EV: ${bn(kpis.ev)}${price}. ${tv}.`;
}

/** Sagt dem Co-Pilot, ob hinter ihm ein Modell steht oder nur die Regelantworten. */
export async function GET() {
  return NextResponse.json({ ai: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(request: NextRequest) {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body?.message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (!body.company || !body.kpis) {
    return NextResponse.json({ error: "Company and KPI context are required." }, { status: 400 });
  }

  const rules = () => NextResponse.json({ reply: fallbackReply(body), citations: ["Model", "Peers"], mode: "rules" });
  if (!process.env.ANTHROPIC_API_KEY) return rules();

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const messages: Anthropic.MessageParam[] = [
      ...(body.history || []).map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.body,
      })),
      { role: "user", content: body.message },
    ];
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: buildSystemPrompt(body),
      messages,
    });
    const reply = response.content[0].type === "text" ? response.content[0].text.trim() : "(no response)";
    return NextResponse.json({ reply, citations: ["Model", "Peers", "Sensitivity"] });
  } catch (error) {
    // Derselbe Rückfall wie ohne Schlüssel — kein roher API-Fehler im Chat.
    console.warn(`[ai-chat] falling back to rules: ${error instanceof Error ? error.message : error}`);
    return rules();
  }
}
