"use client";

import { useState } from "react";
import { Ico } from "./icons";
import { OutputRail } from "./OutputRail";
import { CoPilot } from "./CoPilot";
import type { CompanyInput, ModelInput, ForecastYear, Peer } from "@/lib/types";

type Kpis = {
  sharePrice: number;
  spot: number;
  upside: number;
  ev: number;
  equity: number;
  dcfEv: number;
  compsEv: number;
  terminal: number;
  evEbitda: number;
  evRevenue: number;
};

type Props = {
  kpis: Kpis;
  company: CompanyInput;
  model: ModelInput;
  forecast: ForecastYear[];
  peers: Peer[];
  scenario: string;
  activeTab: string;
  valuationRows: { label: string; low: number; high: number }[];
};

export function RightRail({ kpis, company, model, forecast, peers, scenario, activeTab, valuationRows }: Props) {
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
          : <CoPilot company={company} kpis={kpis} model={model} forecast={forecast} peers={peers} scenario={scenario} activeTab={activeTab}/>}
      </div>
    </aside>
  );
}
