"use client";

import { Ico } from "./icons";
import type { WorkspaceTab, StepStatus } from "@/lib/types";

const STEPS: { id: WorkspaceTab; num: string; label: string }[] = [
  { id: "setup",     num: "01", label: "Case Setup" },
  { id: "model",     num: "02", label: "Model" },
  { id: "peers",     num: "03", label: "Peers" },
  { id: "valuation", num: "04", label: "Valuation" },
  { id: "memo",      num: "05", label: "Memo" },
];

function StatusDot({ status }: { status: StepStatus }) {
  if (status === "done") return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="6.5" fill="var(--green, #16a34a)" stroke="none"/>
      <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (status === "active") return (
    <span style={{
      width: 8, height: 8, borderRadius: "50%",
      background: "var(--blue)", display: "inline-block", flexShrink: 0,
    }}/>
  );
  if (status === "warn") return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="6.5" fill="none" stroke="var(--gold, #d97706)" strokeWidth="1.5"/>
      <path d="M7 4.5v3M7 9.5v.5" stroke="var(--gold, #d97706)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  return (
    <span style={{
      width: 8, height: 8, borderRadius: "50%",
      border: "1.5px solid var(--muted)", display: "inline-block", flexShrink: 0,
    }}/>
  );
}

type Props = {
  active: WorkspaceTab;
  onSet: (t: WorkspaceTab) => void;
  onCompare: () => void;
  compareOn: boolean;
  statuses: Record<WorkspaceTab, StepStatus>;
};

export function WorkflowNav({ active, onSet, onCompare, compareOn, statuses }: Props) {
  const doneCount = Object.values(statuses).filter(s => s === "done").length;

  return (
    <nav className="workflow">
      {STEPS.map((s, i) => {
        const status = statuses[s.id];
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            className={"step" + (isActive ? " active" : "") + (status === "done" ? " done" : "")}
            onClick={() => onSet(s.id)}
            style={{ gap: 8 }}
          >
            <StatusDot status={status} />
            <span className="step-num" style={{ opacity: status === "pending" ? 0.45 : 1 }}>{s.num}</span>
            <span style={{ opacity: status === "pending" ? 0.55 : 1 }}>{s.label}</span>
            {i < STEPS.length - 1 && status !== "active" && (
              <span style={{
                marginLeft: "auto", fontSize: 10,
                color: "var(--muted)", opacity: 0.4,
              }}>→</span>
            )}
          </button>
        );
      })}

      {doneCount > 0 && (
        <span style={{
          marginLeft: 4, fontSize: 11, color: "var(--muted)",
          fontFamily: "var(--font-mono)", whiteSpace: "nowrap",
          alignSelf: "center",
        }}>
          {doneCount}/5
        </span>
      )}

      <span className="divider" style={{ marginLeft: doneCount > 0 ? 4 : undefined }}></span>
      <button className={"compare-toggle" + (compareOn ? " active" : "")} onClick={onCompare}>
        <Ico.compare/> Compare cases
      </button>
    </nav>
  );
}
