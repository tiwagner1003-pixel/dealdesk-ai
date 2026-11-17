"use client";

import { useEffect, useRef, useState } from "react";
import { Ico } from "./icons";
import type { CompanyInput, ChatMessage, ModelInput, ForecastYear, Peer } from "@/lib/types";
import { formatMoney } from "@/lib/format";

type Kpis = {
  ev: number;
  sharePrice: number;
  spot?: number;
  upside?: number;
  terminal: number;
  dcfEv?: number;
  compsEv?: number;
  evEbitda?: number;
  evRevenue?: number;
};

type Props = {
  company: CompanyInput;
  kpis: Kpis;
  model?: ModelInput;
  forecast?: ForecastYear[];
  peers?: Peer[];
  scenario?: string;
  activeTab?: string;
};

const STEP_SUGGESTIONS: Record<string, string[]> = {
  setup:     ["What data do I need for the model?", "What WACC suits this sector?", "How do I pick a peer set?", "Fetch SEC data for this ticker"],
  model:     ["Is my WACC reasonable?", "Review my forecast assumptions", "What's driving FCF in year 5?", "Stress test terminal growth"],
  peers:     ["Suggest peers for this sector", "When should I exclude an outlier?", "How do my multiples compare?", "Normalize for growth differences"],
  valuation: ["Walk me through the football field", "Why is DCF vs comps diverging?", "What's the implied upside?", "Explain the WACC sensitivity"],
  memo:      ["Draft the investment thesis", "What are the key IC risks?", "Write the deal summary", "What diligence questions remain?"],
};

const STEP_HINT: Record<string, string> = {
  setup:     "Set the deal context — enter a ticker and fetch SEC data to auto-populate the model.",
  model:     "Review assumptions. WACC and terminal growth are the biggest value drivers.",
  peers:     "Select at least 2-3 comparable companies. Exclude outliers that distort the median.",
  valuation: "DCF and comps are now triangulated. Check if the spread is defensible.",
  memo:      "All inputs are ready. Generate the IC memo or ask me to preview the thesis first.",
};

export function CoPilot({ company, kpis, model, forecast, peers, scenario, activeTab }: Props) {
  const getInitialMessage = () => ({
    role: "assistant" as const,
    body: `I've loaded your ${company.name} case. Here's a quick read:`,
    bullets: [
      `Blended EV ${formatMoney(kpis.ev, company.currency)}${kpis.dcfEv ? ` (DCF ${formatMoney(kpis.dcfEv, company.currency)} / Comps ${formatMoney(kpis.compsEv ?? 0, company.currency)})` : ""}`,
      `Implied share price ${company.currency} ${kpis.sharePrice.toFixed(2)}${kpis.spot ? ` vs spot ${company.currency} ${kpis.spot.toFixed(2)} → ${kpis.upside && kpis.upside > 0 ? "+" : ""}${kpis.upside?.toFixed(1)}%` : ""}`,
      `Terminal value ${kpis.terminal.toFixed(0)}% of DCF EV — key sensitivity lever`,
    ],
    citations: ["DCF", "Peer set", "Sensitivity"],
  });

  const [messages, setMessages] = useState<ChatMessage[]>([getInitialMessage()]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  // null = noch unbekannt, false = kein Modell angebunden, nur Regelantworten
  const [aiLive, setAiLive] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/ai-chat").then((r) => r.json()).then((d) => setAiLive(Boolean(d.ai))).catch(() => setAiLive(false));
  }, []);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    setMessages([getInitialMessage()]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.ticker]);

  async function send(payload?: string) {
    const t = payload ?? text;
    if (!t.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", body: t };
    setMessages((m) => [...m, userMsg]);
    setText("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: t,
          company,
          kpis,
          model,
          forecast,
          peers: peers?.filter((p) => p.included !== false),
          scenario,
          history: messages.slice(-6).map((m) => ({ role: m.role, body: m.body })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Co-Pilot request failed.");
      setMessages((m) => [...m, {
        role: "assistant",
        body: data.reply || "No reply.",
        citations: data.citations || [],
      }]);
    } catch {
      setMessages((m) => [...m, {
        role: "assistant",
        body: "Co-Pilot couldn't reach the server. Please try again.",
        citations: [],
      }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = activeTab && STEP_SUGGESTIONS[activeTab]
    ? STEP_SUGGESTIONS[activeTab]
    : ["What drives the upside case?", "Stress test WACC ±100bps", "Benchmark peer multiples", "Key IC risks"];

  const stepHint = activeTab && STEP_HINT[activeTab] ? STEP_HINT[activeTab] : null;


  return (
    <div className="copilot">
      <div className="copilot-feed" ref={feedRef}>
        {messages.map((m, i) => (
          <div key={i} className={"copilot-msg " + m.role}>
            <span className="who">
              {m.role === "user"
                ? <>You</>
                : aiLive === false ? <>Co-Pilot · rule-based</> : <><Ico.sparkle/> Co-Pilot · Claude</>}
            </span>
            <div className="body">
              {m.body}
              {m.bullets && (
                <ul style={{ margin: "8px 0 0", paddingLeft: 16 }}>
                  {m.bullets.map((b, j) => <li key={j} style={{ marginBottom: 4 }}>{b}</li>)}
                </ul>
              )}
            </div>
            {m.role === "assistant" && m.citations && m.citations.length > 0 && (
              <div className="citations">
                {m.citations.map((c, j) => (
                  <span key={j} className="citation">[{j + 1}] {c}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="copilot-msg assistant">
            <span className="who"><Ico.sparkle/> Claude · thinking…</span>
            <div className="body"><span className="spin">⟳</span></div>
          </div>
        )}
      </div>

      <div className="copilot-input">
        {stepHint && (
          <div style={{
            fontSize: 11.5, color: "var(--muted)", padding: "6px 10px",
            background: "var(--panel-soft)", borderRadius: 5,
            borderLeft: "2px solid var(--blue)", marginBottom: 6,
            lineHeight: 1.5,
          }}>
            {stepHint}
          </div>
        )}
        <div className="copilot-suggestions">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)}>{s}</button>
          ))}
        </div>
        <div className="row">
          <input
            placeholder={`Ask about ${company.name}…`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="send" onClick={() => send()}><Ico.send/></button>
        </div>
        <div className="actions">
          <button onClick={() => setText((t) => `${t}${t ? " " : ""}@Memo `)}>@ Mention</button>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>
            {aiLive === false ? "No AI model connected · answers come from the model figures" : aiLive ? "Claude" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
