"use client";

import { Ico } from "./icons";
import type { WorkspaceTab } from "@/lib/types";

const STEPS: { id: WorkspaceTab; num: string; label: string }[] = [
  { id: "setup",     num: "01", label: "Case Setup" },
  { id: "model",     num: "02", label: "Model" },
  { id: "peers",     num: "03", label: "Peers" },
  { id: "valuation", num: "04", label: "Valuation" },
  { id: "lbo",       num: "05", label: "LBO" },
  { id: "memo",      num: "06", label: "Memo" },
];

type Props = {
  active: WorkspaceTab;
  onSet: (t: WorkspaceTab) => void;
  onCompare: () => void;
  compareOn: boolean;
};

export function WorkflowNav({ active, onSet, onCompare, compareOn }: Props) {
  return (
    <nav className="workflow">
      {STEPS.map((s) => (
        <button
          key={s.id}
          className={"step" + (active === s.id ? " active" : "")}
          onClick={() => onSet(s.id)}
        >
          <span className="step-num">{s.num}</span>
          <span>{s.label}</span>
        </button>
      ))}
      <span className="divider"></span>
      <button className={"compare-toggle" + (compareOn ? " active" : "")} onClick={onCompare}>
        <Ico.compare/> Compare cases
      </button>
    </nav>
  );
}
