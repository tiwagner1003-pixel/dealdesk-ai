"use client";
import { useEffect, useMemo, useState } from "react";

import { Sidebar } from "./Sidebar";
import { Dashboard, type RecentCase } from "./Dashboard";
import { CaseLibrary, type LibraryCase } from "./CaseLibrary";
import { TickerSearch, MarketDataCard, PriceChart } from "./Market";
import { LboPanel } from "./LboPanel";
import { Sens2DSlider } from "./Sens2DSlider";

// existing components that already live in the project:
import { Chrome } from "./Chrome";
import { Hero } from "./Hero";
import { WorkflowNav } from "./WorkflowNav";
import { SetupPanel } from "./panels/SetupPanel";
import { ModelPanel } from "./panels/ModelPanel";
import { PeersPanel } from "./panels/PeersPanel";
import { ValuationPanel } from "./panels/ValuationPanel";
import { MemoPanel } from "./panels/MemoPanel";
import { RightRail } from "./RightRail";
import { CaseCompare } from "./CaseCompare";
import { Ico } from "./icons";

import { calculateDcf, calculateProjection, median, pct, compsOf, blendEv,
  INITIAL_COMPANY, INITIAL_MODEL, INITIAL_FORECAST, INITIAL_PEERS } from "@/lib/finance";
import { exportExcelModel } from "@/lib/exportExcel";
import { exportPowerPointDeck } from "@/lib/exportPpt";
import type { CompanyInput, ModelInput, ForecastYear, Peer, Scenario, WorkspaceTab, AiMemo, DcfOutput } from "@/lib/types";
import { MARKET_DB, suggestPeers, findTicker, type TickerInfo } from "@/lib/marketDb";
import { useMarketQuote } from "@/lib/useMarketData";
import { SECTOR_TEMPLATES, type SectorTemplate } from "@/lib/templates";
import { GUEST_USER } from "@/lib/user";
import { loadState, saveState, clearState } from "@/lib/persist";

type View = "dashboard" | "library" | "workspace";

type CaseState = {
  id: string;
  company: CompanyInput;
  model: ModelInput;
  forecast: ForecastYear[];
  peers: Peer[];
  scenario: Scenario;
  tab: WorkspaceTab | "lbo";
  aiMemo: AiMemo | null;
  generating: boolean;
  // library meta (denormalised — derived but cached)
  status: "Draft" | "In review" | "Approved" | "Archived";
  author: string;
  updated: string;
};

/**
 * Fallpläne für Titel, bei denen die Faustregel des Beispielfalls (Wachstum je
 * Teilbranche, Marge aus dem Vorjahr) ein schiefes Bild ergäbe. Die Zahlen folgen
 * den Angaben des Unternehmens, nicht einer eigenen Prognose.
 */
type Fallplan = {
  /** Fertige Prognose, Jahr für Jahr. */
  forecast?: ForecastYear[];
  /**
   * Umsatz des letzten abgeschlossenen Geschäftsjahrs, auf den das Wachstum aus dem
   * Konsens aufsetzt. Ohne Angabe gilt der Umsatz der letzten zwölf Monate aus der
   * Datenbank — der passt nur, wenn das Wachstum selbst auf zwölf Monate bezogen ist.
   */
  basis?: number;
  /** Belegte Jahre als [Wachstum, EBITDA-Marge]; der Rest wird nach `fortschreiben` ergänzt. */
  belegt?: [number, number][];
  /** Vorgeschlagene Peers, die angezeigt werden, aber nicht zählen. */
  ohnePeers?: string[];
};

/**
 * Belegt ist, was das Unternehmen ausgibt oder der Analystenkonsens schätzt. Danach
 * sinkt das Wachstum in gleichen Schritten auf das ewige Wachstum der Vorlage, das es
 * im ersten Jahr nach der Planung erreicht; die Marge bleibt auf dem letzten belegten
 * Stand. Eine Regel für alle Fälle statt einer Schätzung je Fall — sie wird nicht
 * nachgestellt, bis der Kurs passt.
 */
function fortschreiben(belegt: [number, number][], ewig: number, jahre = 5): ForecastYear[] {
  const out = belegt.map(([g, m], i) => ({ year: i + 1, revenueGrowth: g, ebitdaMargin: m }));
  const [gLetzt, mLetzt] = belegt[belegt.length - 1];
  const rest = jahre - belegt.length;
  for (let k = 1; k <= rest; k++) {
    const g = gLetzt - ((gLetzt - ewig) * k) / (rest + 1);
    out.push({ year: belegt.length + k, revenueGrowth: Math.round(g * 10) / 10, ebitdaMargin: mLetzt });
  }
  return out;
}

const FALLPLAN: Record<string, Fallplan> = {
  // Adyen: für 2026 laut Halbjahresbericht 21–23 % Wachstum (währungsbereinigt, mit
  // Zukäufen), laut Q3-Update 50 % EBITDA-Marge; das Ziel „über 55 % bis 2028“ ist
  // mit dem Q3-Update gestrichen, deshalb
  // steigt die Marge hier nur langsam. Nexi und Worldline stehen in der
  // Vergleichsgruppe, zählen aber nicht: niedriges Wachstum, hohe Verschuldung,
  // Umbau — kein Maßstab für einen Anbieter mit über 20 % Wachstum.
  "ADYEN.AS": {
    forecast: [
      { year: 1, revenueGrowth: 22, ebitdaMargin: 50 },
      { year: 2, revenueGrowth: 20, ebitdaMargin: 51 },
      { year: 3, revenueGrowth: 18, ebitdaMargin: 52 },
      { year: 4, revenueGrowth: 16, ebitdaMargin: 53 },
      { year: 5, revenueGrowth: 14, ebitdaMargin: 53 },
    ],
    ohnePeers: ["NEXI.MI", "WLN.PA"],
  },
  // NVIDIA, Geschäftsjahr endet im Januar. GJ 2027: neun Monate 293,7 Mrd. USD plus
  // Ausblick Q4 130 Mrd. = +96 % (Q4 mit einer Woche mehr). GJ 2028: Ausblick des
  // Unternehmens rund +75 %. GJ 2029: Konsens rund +30 % (900–940 Mrd., nur 38
  // Analysten). Marge: Q3 GAAP-EBITDA 68 %, Bruttomarge für Q4 drei Punkte tiefer
  // ausgegeben, daher 67 % im laufenden Jahr und 65 % danach.
  "NVDA": { belegt: [[96, 67], [75, 65], [30, 65]] },
  // BlackRock. 2026: neun Monate 21.534 Mio. USD plus Q3 als Schätzung für Q4 = +21 %.
  // 2027: Konsens 32,4–32,8 Mrd. = +11 %. Marge: bereinigtes operatives Ergebnis der
  // neun Monate 8.915 Mio. auf den Gesamtumsatz = 41 %. Banken stehen als Peers da,
  // zählen aber nicht: Für eine Bank ist EV/EBITDA keine Kennzahl, weil Einlagen
  // Betriebsmittel sind und keine Finanzschulden.
  "BLK": { belegt: [[21, 41], [11, 41]], ohnePeers: ["GS", "JPM"] },
  // Snowflake, Geschäftsjahr endet im Januar. GJ 2027: Produktumsatz laut Ausblick
  // 6.070 Mio. USD plus Dienstleistungen = +34 %. GJ 2028: Konsens 8,13 Mrd. = +29 %.
  // Marge: ausgegebene operative Marge non-GAAP 14,5 % plus Abschreibungen = 17 %.
  // Aktienvergütung ist darin NICHT abgezogen; das schmeichelt dem DCF.
  "SNOW": { belegt: [[34, 17], [29, 17]] },
  // Novo Nordisk. 2026: Ausblick für den bereinigten Umsatz −2 bis +2 % (ohne die
  // einmalige Auflösung der 340B-Rückstellung). 2027: Konsens rund +1 %, kein Ausblick
  // des Unternehmens. Marge: bereinigtes EBITDA der neun Monate 2026 = 51 %.
  // Investitionen liegen 2026 bei rund 50 Mrd. DKK (16 % des Umsatzes), das Modell
  // rechnet mit 5 % — der DCF ist an dieser Stelle zu freundlich.
  "NOVO-B.CO": { belegt: [[0, 51], [1, 51]] },
  // ASML. 2026: Ausblick 44–45 Mrd. EUR = +36 %. 2027: kein Ausblick, Konsens rund
  // +28 % (Bloomberg; Yahoo-Mittel 57,4 Mrd., vor dem Q3-Bericht). Marge: operative
  // Marge Q3 44,4 %, aus dem Q4-Ausblick (57 % Bruttomarge, 1,6 Mrd. Kosten) rund 46 %,
  // das schwächere erste Halbjahr zieht das Jahr auf rund 42 %; danach 45 %. Dazu
  // jeweils knapp drei Punkte Abschreibungen wie 2025 (916 Mio. auf 32,7 Mrd.).
  "ASML.AS": { belegt: [[36, 45], [28, 48]] },
  // Die folgenden sechs stehen auf dem Analystenkonsens bei Yahoo (Stand 23.11.2026):
  // Umsatz des laufenden und des nächsten Geschäftsjahrs, Marge aus dem EBITDA der
  // letzten zwölf Monate. Kein Unternehmensausblick, keine eigene Schätzung.
  //
  // SAP. 2025: 36.801 Mio. EUR. Konsens 2026 40,5 Mrd. (+9,9 %), 2027 45,3 Mrd. (+12 %).
  "SAP.DE": { basis: 36801, belegt: [[9.9, 31], [12, 31]] },
  // Siemens, Geschäftsjahr endet im September. GJ 2026: 83,4 Mrd. EUR. Konsens GJ 2027
  // 91,3 Mrd. (+9,5 %, nur sieben Analysten), GJ 2028 97,6 Mrd. (+7 %).
  "SIE.DE": { basis: 83374, belegt: [[9.5, 18], [7, 18]] },
  // Infineon, Geschäftsjahr endet im September. GJ 2026: 16,35 Mrd. EUR. Konsens
  // GJ 2027 +17,2 %; für GJ 2028 gibt es bei Yahoo keinen Wert, deshalb nur ein Jahr.
  "IFX.DE": { basis: 16351, belegt: [[17.2, 25]] },
  // AMD. 2025: 34.638 Mio. USD. Konsens 2026 52,2 Mrd. (+51 %), 2027 95,9 Mrd. (+84 %,
  // 50 Analysten) — der Sprung kommt aus den angekündigten Rechenzentrumsaufträgen und
  // ist so unsicher, wie er aussieht. Die Marge der letzten zwölf Monate (24,5 %) wird
  // nicht hochgezogen, obwohl Skalierung sie heben dürfte.
  "AMD": { basis: 34638, belegt: [[50.8, 24.5], [83.6, 24.5]] },
  // LVMH. 2025: 80.805 Mio. EUR. Konsens 2026 −0,4 %, 2027 +4,4 %.
  "MC.PA": { basis: 80805, belegt: [[-0.4, 25], [4.4, 25]] },
  // ExxonMobil. 2025: 332.236 Mio. USD. Konsens 2026 +31,3 % (Ölpreis), 2027 flach.
  // Die Marge von 20 % stammt aus einem Jahr mit hohen Preisen; fällt der Ölpreis,
  // fällt sie mit — das Modell hält sie fest.
  "XOM": { basis: 332236, belegt: [[31.3, 20], [0, 20]] },
};

function seedCase(id: string, ticker: string, tpl: SectorTemplate, scenario: Scenario,
                  status: CaseState["status"], author: string, updated: string): CaseState {
  const t = findTicker(ticker) || MARKET_DB[0];
  const company: CompanyInput = {
    name: t.name, ticker: t.ticker, exchange: t.exchange,
    sector: t.sector,
    region: t.exchange === "NSDQ" || t.exchange === "NYSE" ? "Americas"
          : t.exchange === "PRIV" ? "Private"
          : "Europe",
    currency: t.ccy,
  };
  const plan = FALLPLAN[t.ticker];
  const ebMargin = t.ebitda > 0 && t.revenue > 0 ? Math.round((t.ebitda / t.revenue) * 100) : 30;
  const model: ModelInput = {
    revenue: plan?.basis ?? (t.revenue || 1000),
    depreciationPercent: 4,
    taxRate: 25,
    capexPercent: 5,
    nwcPercent: 2,
    netDebt: t.netDebt || 0,
    shares: t.shares || 100,
    wacc: tpl.wacc,
    terminalGrowth: tpl.terminal,
    exitMultiple: tpl.exitMultiple,
  };
  const g = t.subSector?.includes("AI") ? 28 : t.subSector?.includes("Pay") ? 13 : 9;
  const forecast: ForecastYear[] = plan?.forecast
    ?? (plan?.belegt ? fortschreiben(plan.belegt, tpl.terminal) : null)
    ?? [
    { year: 1, revenueGrowth: g,     ebitdaMargin: ebMargin },
    { year: 2, revenueGrowth: g - 1, ebitdaMargin: ebMargin + 1 },
    { year: 3, revenueGrowth: g - 3, ebitdaMargin: ebMargin + 1 },
    { year: 4, revenueGrowth: g - 5, ebitdaMargin: ebMargin + 2 },
    { year: 5, revenueGrowth: Math.max(g - 7, 4), ebitdaMargin: ebMargin + 2 },
  ];
  const peers = suggestPeers(t, 5).map((p) =>
    plan?.ohnePeers?.includes(p.ticker) ? { ...p, included: false } : p);
  return {
    id, company, model, forecast, peers, scenario, tab: "setup",
    aiMemo: null, generating: false, status, author, updated,
  };
}

const TPL_FIN  = SECTOR_TEMPLATES.find((t) => t.id === "fintech")!;
const TPL_SAAS = SECTOR_TEMPLATES.find((t) => t.id === "saas")!;
const TPL_AI   = SECTOR_TEMPLATES.find((t) => t.id === "ai")!;
const TPL_LUX  = SECTOR_TEMPLATES.find((t) => t.id === "lux")!;
const TPL_PHA  = SECTOR_TEMPLATES.find((t) => t.id === "pharma")!;
const TPL_BNK  = SECTOR_TEMPLATES.find((t) => t.id === "bank")!;
const TPL_ENE  = SECTOR_TEMPLATES.find((t) => t.id === "energy")!;
const TPL_IND  = SECTOR_TEMPLATES.find((t) => t.id === "indust")!;

/**
 * Stand der Beispielfälle. Wer ihn hochsetzt, ersetzt bei wiederkehrenden
 * Besuchern alle Beispielfälle durch die aktuelle Fassung — eigene Fälle bleiben.
 * Hochsetzen, sobald sich Fallplan, Marktdaten oder Peers der Beispiele ändern;
 * sonst rechnet jeder, der die Seite schon kannte, mit dem alten Stand weiter.
 */
const BEISPIEL_STAND = "2026-11-23";

const SEED_CASES: CaseState[] = [
  seedCase("adyen",   "ADYEN.AS", TPL_FIN,  "base",     "In review", "Luca Schmidt",      "14:08 today"),
  seedCase("stripe",  "STRIPE",   TPL_FIN,  "upside",   "Draft",     "Luca Schmidt",      "11:08 today"),
  seedCase("klarna",  "KLARN.IPO",TPL_FIN,  "downside", "Draft",     "Anna Vogel",        "Yesterday 16:42"),
  seedCase("nvda",    "NVDA",     TPL_AI,   "upside",   "Approved",  "Sebastian Krüger",  "Yesterday 13:18"),
  seedCase("asml",    "ASML.AS",  TPL_SAAS, "base",     "In review", "Marie Forster",     "Yesterday 09:14"),
  seedCase("lvmh",    "MC.PA",    TPL_LUX,  "base",     "Approved",  "Anna Vogel",        "May 24"),
  seedCase("novo",    "NOVO-B.CO",TPL_PHA,  "base",     "Draft",     "Sebastian Krüger",  "May 22"),
  seedCase("blk",     "BLK",      TPL_BNK,  "upside",   "Approved",  "Tobias Reinhardt",  "May 20"),
  seedCase("snow",    "SNOW",     TPL_SAAS, "downside", "Archived",  "Luca Schmidt",      "May 18"),
  seedCase("xom",     "XOM",      TPL_ENE,  "downside", "Approved",  "Tobias Reinhardt",  "May 10"),
  seedCase("sap",     "SAP.DE",   TPL_SAAS, "base",     "In review", "Marie Forster",     "May 8"),
  seedCase("siemens", "SIE.DE",   TPL_IND,  "base",     "Draft",     "Tobias Reinhardt",  "May 6"),
  // Infineon mit der Industrievorlage: Leistungshalbleiter für Auto und Industrie
  // laufen mit deren Zyklus, nicht mit dem der KI-Rechenzentren.
  seedCase("infineon","IFX.DE",   TPL_IND,  "base",     "Draft",     "Marie Forster",     "May 5"),
  seedCase("amd",     "AMD",      TPL_AI,   "base",     "In review", "Sebastian Krüger",  "May 4"),
];

function stamp() {
  return new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function App() {
  // Konto-System ruht: Jeder landet direkt im Dashboard, ohne Anmeldung.
  const user = GUEST_USER;
  const [view, setView] = useState<View>("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cases, setCases] = useState<CaseState[]>(SEED_CASES);
  const [activeCase, setActiveCase] = useState("adyen");
  const [openCases, setOpenCases] = useState<string[]>(["adyen", "stripe", "klarna"]);
  // Speichern im Browser: erst nach dem Laden schreiben, sonst überschreiben
  // die Beispielfälle beim ersten Rendern den gespeicherten Stand.
  const [loaded, setLoaded] = useState(false);
  const [saveState_, setSaveState] = useState<"idle" | "saved" | "blocked">("idle");
  const [compareOn, setCompareOn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [watchlist] = useState(["ADYEN.AS", "NVDA", "MSFT", "MC.PA", "ASML.AS", "WISE.L", "META", "NOVO-B.CO"]);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  useEffect(() => {
    const stored = loadState<CaseState>();
    if (stored) {
      // Eigene Fälle bleiben, wie sie sind. Beispielfälle werden durch die aktuelle
      // Fassung ersetzt, wenn sie mit einem älteren Stand gespeichert wurden, und
      // fehlende Beispiele kommen hinzu.
      const veraltet = stored.beispielStand !== BEISPIEL_STAND;
      const frisch = new Map(SEED_CASES.map((c) => [c.id, c]));
      const bekannt = new Set(stored.cases.map((c) => c.id));
      setCases([...stored.cases.map((c) => (veraltet && frisch.get(c.id)) || { ...c, generating: false }),
                ...SEED_CASES.filter((c) => !bekannt.has(c.id))]);
      setOpenCases(stored.openCases);
      setActiveCase(stored.activeCase);
      setTheme(stored.theme);
      setSaveState("saved");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      const ok = saveState({ version: 1, cases, openCases, activeCase, theme, beispielStand: BEISPIEL_STAND });
      setSaveState(ok ? "saved" : "blocked");
    }, 400);
    return () => clearTimeout(id);
  }, [loaded, cases, openCases, activeCase, theme]);

  function resetCases() {
    if (!window.confirm("Discard all your cases and changes in this browser and restore the sample cases?")) return;
    clearState();
    setCases(SEED_CASES);
    setOpenCases(["adyen", "stripe", "klarna"]);
    setActiveCase("adyen");
    setView("dashboard");
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cur = cases.find((c) => c.id === activeCase);
  const patch = (id: string, p: Partial<CaseState>) =>
    setCases((cs) => cs.map((c) => c.id === id ? { ...c, ...p } : c));

  function openCase(id: string) {
    if (!openCases.includes(id)) setOpenCases([...openCases, id]);
    setActiveCase(id);
    setView("workspace");
  }
  function closeCase(id: string) {
    const next = openCases.filter((x) => x !== id);
    setOpenCases(next);
    if (id === activeCase && next.length) setActiveCase(next[next.length - 1]);
    if (next.length === 0) setView("dashboard");
  }
  function newCase(ticker?: TickerInfo, tpl?: SectorTemplate) {
    const id = "case-" + Date.now();
    const c = seedCase(id, ticker?.ticker ?? "ADYEN.AS", tpl ?? TPL_FIN, "base",
                       "Draft", user.name, stamp());
    if (!ticker) c.company.name = "New case";
    setCases((cs) => [c, ...cs]);
    setOpenCases((o) => [...o, id]);
    setActiveCase(id);
    setView("workspace");
  }
  function pickTicker(t: TickerInfo) { setSearchOpen(false); newCase(t); }
  function duplicateCase(id: string) {
    const src = cases.find((c) => c.id === id); if (!src) return;
    const newId = "case-" + Date.now();
    setCases((cs) => [{ ...src, id: newId, status: "Draft", updated: stamp(), author: user.name }, ...cs]);
  }
  function deleteCase(id: string) {
    setCases((cs) => cs.filter((c) => c.id !== id));
    setOpenCases((o) => o.filter((x) => x !== id));
    if (id === activeCase) {
      const left = openCases.filter((x) => x !== id);
      if (left.length) setActiveCase(left[left.length - 1]); else setView("dashboard");
    }
  }

  // recent/library cases — derive from CaseState[]
  const libCases: LibraryCase[] = cases.map((c) => {
    const t = findTicker(c.company.ticker);
    const k = kpiOf(c);
    return {
      id: c.id, name: c.company.name, ticker: c.company.ticker, sector: c.company.sector,
      ccy: c.company.currency, scenario: c.scenario, status: c.status,
      author: c.author, updated: c.updated,
      ev: k.ev,
      // Ohne Börsenkurs gibt es keinen Abstand zum Kurs, nur einen zum eigenen Abschlag.
      upside: t && !t.priv ? k.upside : undefined,
    };
  });
  const recent: RecentCase[] = libCases.map((c) => ({
    id: c.id, name: c.name, ticker: c.ticker, scenario: c.scenario,
    status: c.status, author: c.author, updated: c.updated,
  }));

  return (
    <div className="app-shell">
      <Sidebar
        view={view} setView={setView}
        onSearch={() => setSearchOpen(true)}
        onTemplates={() => {
          setView("dashboard");
          setTimeout(() => document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" }), 50);
        }}
        onTheme={() => setTheme((t) => t === "dark" ? "light" : "dark")}
        theme={theme}
      />

      <div className="app-main">
        <Chrome
          cases={openCases.map((id) => {
            const c = cases.find((x) => x.id === id)!;
            return { id, name: c.company.name, ticker: c.company.ticker, scenario: c.scenario };
          })}
          activeCase={activeCase}
          onActivate={(id: string) => { setActiveCase(id); setView("workspace"); }}
          onClose={closeCase}
          onAdd={() => newCase()}
          theme={theme}
          onTheme={() => setTheme((t) => t === "dark" ? "light" : "dark")}
          onSearch={() => setSearchOpen(true)}
          saveState={saveState_}
          onCompare={() => setCompareOn((v) => !v)}
          compareOn={compareOn}
        />

        <div className={"app-content" + (view === "workspace" ? " with-rail" : "")}>
          {view === "dashboard" && (
            <Dashboard
              user={user} recentCases={recent} watchlist={watchlist}
              memoCount={cases.filter((c) => c.aiMemo).length}
              onOpenCase={openCase} onNewCase={newCase} onOpenTicker={(t) => newCase(t)}
              onOpenSearch={() => setSearchOpen(true)}
              onOpenLibrary={() => setView("library")}
            />
          )}
          {view === "library" && (
            <CaseLibrary cases={libCases} onOpenCase={openCase} onNewCase={() => newCase()}
              onDuplicateCase={duplicateCase} onDeleteCase={deleteCase} onReset={resetCases}/>
          )}
          {view === "workspace" && cur && (
            <Workspace
              cur={cur}
              onPatch={(p) => patch(cur.id, p)}
              compareOn={compareOn} setCompareOn={setCompareOn}
            />
          )}

          {view === "workspace" && cur && (
            <RightRail
              kpis={kpiOf(cur)}
              company={cur.company}
              valuationRows={ffOf(cur)}
            />
          )}
        </div>
      </div>

      <TickerSearch open={searchOpen} onClose={() => setSearchOpen(false)} onPick={pickTicker}/>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Workspace — uses existing panels + new market/LBO/Sens2D
   ──────────────────────────────────────────────────────────────── */
function Workspace({ cur, onPatch, compareOn, setCompareOn }: {
  cur: CaseState;
  onPatch: (p: Partial<CaseState>) => void;
  compareOn: boolean;
  setCompareOn: (v: boolean) => void;
}) {
  const { company, model, forecast, peers, scenario, tab } = cur;
  const setTab = (t: CaseState["tab"]) => onPatch({ tab: t });
  const onCompany = (k: keyof CompanyInput, v: string) => onPatch({ company: { ...company, [k]: v } });
  const onModel = (k: keyof ModelInput, v: string | number) => onPatch({ model: { ...model, [k]: Number(v) || 0 } });
  const onForecast = (i: number, k: keyof ForecastYear, v: string | number) =>
    onPatch({ forecast: forecast.map((r, j) => j === i ? { ...r, [k]: Number(v) || 0 } : r) });
  const onPeer = (i: number, k: keyof Peer, v: string | number | boolean) => {
    onPatch({
      peers: peers.map((p, j) => {
        if (j !== i) return p;
        if (k === "included") return { ...p, included: v === "true" || v === true };
        if (k === "name" || k === "ticker") return { ...p, [k]: String(v) };
        return { ...p, [k]: Number(v) || 0 };
      }),
    });
  };
  const addPeer = () => onPatch({ peers: [...peers, { included: true, name: "New Peer", ticker: "TICK", revenueGrowth: 8, ebitdaMargin: 25, evRevenue: 3, evEbitda: 10 }] });
  const removePeer = (i: number) => onPatch({ peers: peers.filter((_, j) => j !== i) });
  const onScenario = (s: Scenario) => onPatch({ scenario: s });

  const dcf = useMemo(() => calculateDcf(model, forecast, scenario), [model, forecast, scenario]);
  const dcfD = useMemo(() => calculateDcf(model, forecast, "downside"), [model, forecast]);
  const dcfB = useMemo(() => calculateDcf(model, forecast, "base"), [model, forecast]);
  const dcfU = useMemo(() => calculateDcf(model, forecast, "upside"), [model, forecast]);
  const currentEbitda = model.revenue * pct(forecast[0]?.ebitdaMargin || 0);
  const comps = compsOf(peers, model.revenue, currentEbitda);
  const valuationPeers = comps.peers;
  const { has: hasComps, medRev, medEbitda } = comps;
  const seedTicker = findTicker(company.ticker);
  const { ticker: t, loading: marketLoading, error: marketError, refresh: refreshMarket } = useMarketQuote(seedTicker, {
    shares: model.shares,
    netDebt: model.netDebt,
    revenue: model.revenue,
    ebitda: currentEbitda,
  });
  const compsRev = comps.evRev;
  const compsEbitda = comps.evEbitda;
  const blendedEv = blendEv(dcf.enterpriseValue, comps);
  const blendedEq = blendedEv - model.netDebt;
  const blendedSp = model.shares > 0 ? blendedEq / model.shares : 0;
  const spot = t && !t.priv ? t.price : blendedSp * 0.88;
  const upside = spot > 0 ? ((blendedSp / spot) - 1) * 100 : 0;
  const dcfRange = [dcfD.enterpriseValue, dcfB.enterpriseValue, dcfU.enterpriseValue];
  const ffRows = [
    { label: "DCF",           low: Math.min(...dcfRange), high: Math.max(...dcfRange) },
    ...(hasComps ? [
      { label: "EV / Revenue",  low: model.revenue * comps.revLow,   high: model.revenue * comps.revHigh },
      { label: "EV / EBITDA",   low: currentEbitda * comps.ebitdaLow, high: currentEbitda * comps.ebitdaHigh },
    ] : []),
    { label: hasComps ? "Blended range" : "Valuation range", low: blendedEv * 0.85, high: blendedEv * 1.15 },
  ];
  const ffMax = Math.ceil(Math.max(...ffRows.map((r) => r.high)) / 10000) * 10000;
  const sensCols = [model.terminalGrowth - 0.5, model.terminalGrowth, model.terminalGrowth + 0.5];
  const sensRows = [model.wacc - 1, model.wacc, model.wacc + 1].map((wacc) => ({
    wacc,
    values: sensCols.map((tg) => calculateDcf({ ...model, wacc, terminalGrowth: tg }, forecast, scenario).sharePrice),
  }));
  const exportCtx = {
    company, model, forecast, peers, scenario, dcf,
    compsEvRevenue: compsRev,
    compsEvEbitda: compsEbitda,
    blendedEnterpriseValue: blendedEv,
    blendedEquityValue: blendedEq,
    blendedSharePrice: blendedSp,
    medianEvRevenue: medRev,
    medianEvEbitda: medEbitda,
    terminalShare: dcf.terminalShare,
    valuationRows: ffRows,
    valuationScaleMax: ffMax,
    sensitivityRows: sensRows,
    terminalGrowthColumns: sensCols,
    includedPeers: valuationPeers,
    hasComps,
  };

  const kpis = {
    sharePrice: blendedSp, spot, upside, ev: blendedEv, equity: blendedEq,
    dcfEv: dcf.enterpriseValue, compsEv: comps.avg, hasComps,
    terminal: dcf.terminalShare, evEbitda: medEbitda, evRevenue: medRev,
  };

  function autoFillPeers() {
    const peerTicker = findTicker(company.ticker); if (!peerTicker) return;
    onPatch({ peers: suggestPeers(peerTicker, 6) });
  }

  async function generateMemo() {
    onPatch({ generating: true });
    try {
      const res = await fetch("/api/ai-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company, model, forecast, peers, scenario,
          outputs: {
            dcfEnterpriseValue: dcf.enterpriseValue,
            dcfEquityValue: dcf.equityValue,
            blendedEnterpriseValue: blendedEv,
            blendedEquityValue: blendedEq,
            blendedSharePrice: blendedSp,
            medianEvRevenue: medRev,
            medianEvEbitda: medEbitda,
            terminalShare: dcf.terminalShare,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI memo failed.");
      onPatch({ aiMemo: data.memo, tab: "memo" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI memo failed.";
      onPatch({
        aiMemo: {
          recommendation: "Review",
          summary: message,
          thesis: [],
          risks: [message],
          deckOutline: [],
          source: "fallback",
        },
        tab: "memo",
      });
    } finally {
      onPatch({ generating: false });
    }
  }

  return (
    <main className="workspace">
      <Hero company={company} scenario={scenario} onScenario={onScenario} kpis={kpis as any}
        onGenerateMemo={generateMemo}
        onExportPpt={() => exportPowerPointDeck({ ...exportCtx, aiMemo: cur.aiMemo })}
        onExportXls={() => exportExcelModel(exportCtx)}/>
      <WorkflowNav active={tab as any} onSet={(t: WorkspaceTab) => setTab(t)}
        onCompare={() => setCompareOn(!compareOn)} compareOn={compareOn}/>

      {compareOn && (
        <CaseCompare onClose={() => setCompareOn(false)}
          downside={pack(dcfD, model, forecast, "downside")}
          base={pack(dcfB, model, forecast, "base")}
          upside={pack(dcfU, model, forecast, "upside")}
          ccy={company.currency}
          onPickScenario={(s: Scenario) => { onScenario(s); setCompareOn(false); }}/>
      )}

      {tab === "setup" && (
        <>
          <SetupPanel company={company} onCompany={onCompany} scenario={scenario} onScenario={onScenario}/>
          {t && (
            <section className="panel">
              <div className="panel-head">
                <div className="head-title">
                  <span className="eyebrow">Market context</span>
                  <h2>Live market data — {company.name}</h2>
                </div>
                <button className="btn" onClick={refreshMarket} disabled={marketLoading}>
                  <Ico.refresh/> {marketLoading ? "Refreshing" : "Refresh"}
                </button>
              </div>
              {marketError && (
                <div className="panel-body" style={{ paddingBottom: 0 }}>
                  <span className="head-aux">Sample prices — no live quote available right now.</span>
                </div>
              )}
              <div className="panel-body" style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1fr)" }}>
                <MarketDataCard t={t}/>
                <PriceChart t={t} height={260}/>
              </div>
            </section>
          )}
        </>
      )}
      {tab === "model" && <ModelPanel model={model} onModel={onModel} forecast={forecast} onForecast={onForecast} company={company}/>}
      {tab === "peers" && (
        <>
          <section className="panel" style={{ background: "linear-gradient(180deg, var(--blue-soft) 0%, var(--panel) 100%)" }}>
            <div className="panel-body" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <span className="eyebrow" style={{ color: "var(--blue)" }}>AI suggestion</span>
                <h3 style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 600 }}>Auto-fill peer group by sector &amp; size</h3>
                <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 12.5 }}>
                  Match {company.sector} companies with comparable market cap. Edit, remove, or add manually after.
                </p>
              </div>
              <button className="btn primary" onClick={autoFillPeers}><Ico.sparkle/> Auto-fill peers</button>
            </div>
          </section>
          <PeersPanel peers={peers} onPeer={onPeer} onAdd={addPeer} onRemove={removePeer}
            median={{
              revenueGrowth: median(valuationPeers.map((p) => p.revenueGrowth)),
              ebitdaMargin: median(valuationPeers.map((p) => p.ebitdaMargin)),
              evRevenue: medRev, evEbitda: medEbitda,
            }}/>
        </>
      )}
      {tab === "valuation" && (
        <>
          <ValuationPanel ffRows={ffRows} scaleMax={ffMax} ccy={company.currency}
            currentEv={dcf.enterpriseValue}
            sensRows={sensRows} sensCols={sensCols} baseRow={1} baseCol={1}
            projection={dcf.projection} dcf={dcf}
            currentEbitda={currentEbitda} medianEvRevenue={medRev} medianEvEbitda={medEbitda}
            compsEvRevenue={compsRev} compsEvEbitda={compsEbitda} hasComps={hasComps}/>
          <Sens2DSlider model={model} forecast={forecast} scenario={scenario}
            onModelUpdate={(p) => onPatch({ model: { ...model, ...p } })} ccy={company.currency}/>
        </>
      )}
      {tab === "lbo" && <LboPanel company={company}/>}
      {tab === "memo" && (
        <MemoPanel company={company} scenario={scenario}
          dcf={dcf} terminalShare={dcf.terminalShare}
          blendedEv={blendedEv} blendedShare={blendedSp} hasComps={hasComps}
          aiMemo={cur.aiMemo} onGenerate={generateMemo}
          generating={cur.generating} ccy={company.currency}/>
      )}
    </main>
  );
}

function pack(d: DcfOutput, model: ModelInput, forecast: ForecastYear[], s: Scenario) {
  const proj = calculateProjection(model, forecast, s);
  const margins = proj.map((p) => p.ebitdaMargin);
  return {
    ev: d.enterpriseValue, equity: d.equityValue, sharePrice: d.sharePrice,
    year5Revenue: proj[proj.length - 1].revenue,
    year5Fcf: proj[proj.length - 1].fcf,
    avgMargin: margins.reduce((a, b) => a + b, 0) / margins.length,
    terminal: d.terminalShare,
  };
}

function kpiOf(c: CaseState) {
  const dcf = calculateDcf(c.model, c.forecast, c.scenario);
  const ebitda = c.model.revenue * pct(c.forecast[0]?.ebitdaMargin || 0);
  const comps = compsOf(c.peers, c.model.revenue, ebitda);
  const ev = blendEv(dcf.enterpriseValue, comps);
  const eq = ev - c.model.netDebt;
  const sp = c.model.shares > 0 ? eq / c.model.shares : 0;
  const t = findTicker(c.company.ticker);
  const spot = t && !t.priv ? t.price : sp * 0.88;
  return { sharePrice: sp, spot, upside: spot > 0 ? ((sp / spot) - 1) * 100 : 0,
    ev, equity: eq, dcfEv: dcf.enterpriseValue,
    compsEv: comps.avg, hasComps: comps.has,
    terminal: dcf.terminalShare, evEbitda: comps.medEbitda, evRevenue: comps.medRev };
}

function ffOf(c: CaseState) {
  const dcfD = calculateDcf(c.model, c.forecast, "downside");
  const dcfB = calculateDcf(c.model, c.forecast, "base");
  const dcfU = calculateDcf(c.model, c.forecast, "upside");
  const ebitda = c.model.revenue * pct(c.forecast[0]?.ebitdaMargin || 0);
  const comps = compsOf(c.peers, c.model.revenue, ebitda);
  const compsRev = comps.evRev;
  const compsEbitda = comps.evEbitda;
  const range = [dcfD.enterpriseValue, dcfB.enterpriseValue, dcfU.enterpriseValue];
  if (!comps.has) return [
    { label: "DCF",      low: Math.min(...range),      high: Math.max(...range) },
  ];
  return [
    { label: "DCF",      low: Math.min(...range),      high: Math.max(...range) },
    { label: "EV/Rev",   low: compsRev * 0.85,         high: compsRev * 1.15 },
    { label: "EV/EBITDA",low: compsEbitda * 0.85,      high: compsEbitda * 1.15 },
    { label: "Blended",  low: (Math.min(...range) + compsRev * 0.85 + compsEbitda * 0.85) / 3,
                         high: (Math.max(...range) + compsRev * 1.15 + compsEbitda * 1.15) / 3 },
  ];
}
