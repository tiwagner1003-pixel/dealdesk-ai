"use client";

import { useState } from "react";
import { Ico } from "./icons";
import { OutputRail } from "./OutputRail";
import { CoPilot } from "./CoPilot";
import type { CompanyInput, ForecastYear, ModelInput, Peer } from "@/lib/types";

type Kpis = {
  sharePrice: number;
  /** null: keine Börsennotiz, also kein Kurs zum Vergleich. */
  spot: number | null;
  upside: number | null;
  ev: number;
  equity: number;
  dcfEv: number;
  compsEv: number;
  /** false: keine Peers eingeschlossen, der Wert ruht allein auf dem DCF. */
  hasComps?: boolean;
  terminal: number;
  evEbitda: number;
  evRevenue: number;
};

type Props = {
  kpis: Kpis;
  company: CompanyInput;
  valuationRows: { label: string; low: number; high: number }[];
  /** Was der Co-Pilot über den Fall wissen muss, um nicht nur die Kennzahlen zu lesen. */
  context?: { model: ModelInput; forecast: ForecastYear[]; peers: Peer[]; scenario: string; activeTab: string };
};

export function RightRail({ kpis, company, valuationRows, context }: Props) {
  const [tab, setTab] = useState<"output" | "copilot">("copilot");
  return (
    <aside className="rail">
      <div className="rail-tabs">
        <button className={tab === "output" ? "active" : ""} onClick={() => setTab("output")}>
          <span className="dot"></span> Output
        </button>
        <button className={tab === "copilot" ? "active" : ""} onClick={() => setTab("copilot")}>
          <Ico.sparkle/> Co-Pilot
        </button>
      </div>
      <div className="rail-body">
        {tab === "output"
          ? <OutputRail kpis={kpis} company={company} valuationRows={valuationRows}/>
          : <CoPilot company={company} kpis={kpis} {...context}/>}
      </div>
    </aside>
  );
}
