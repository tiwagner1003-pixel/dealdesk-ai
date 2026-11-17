"use client";

import { Ico } from "./icons";
import type { CaseTab } from "@/lib/types";

type Props = {
  cases: CaseTab[];
  activeCase: string;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
  theme: string;
  onTheme: () => void;
  onSearch: () => void;
  saveState: "idle" | "saved" | "blocked";
  onCompare: () => void;
  compareOn: boolean;
};

export function Chrome({
  cases, activeCase, onActivate, onClose, onAdd,
  theme, onTheme, onSearch, saveState, onCompare, compareOn,
}: Props) {
  return (
    <header className="chrome">
      <div className="chrome-top">
        <div className="brand">
          <span className="brand-mark">D</span>
          <span>DealDesk AI</span>
        </div>

        <div className="chrome-cmdk" role="button" tabIndex={0} onClick={onSearch}
             onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSearch(); } }}>
          <Ico.search className="chrome-cmdk-icon"/>
          <span className="chrome-cmdk-text">Search company or ticker…</span>
          <span className="chrome-cmdk-kbd">⌘K</span>
        </div>

        <div className="chrome-actions">
          <button className={"chip-button" + (compareOn ? " active" : "")} onClick={onCompare}>
            <Ico.compare/>
            <span className="chip-label">Compare cases</span>
          </button>
          {saveState !== "idle" && (
            <span className={"chip-button save-state" + (saveState === "blocked" ? " blocked" : "")}
                  title={saveState === "saved"
                    ? "Your cases are stored in this browser only. Clearing site data removes them."
                    : "This browser blocks local storage — changes are lost on reload."}>
              <span className="dot"></span>
              <span className="chip-label">{saveState === "saved" ? "Saved in this browser" : "Not saved"}</span>
            </span>
          )}
          <button className="icon-btn" aria-label="Theme" onClick={onTheme}>
            {theme === "dark" ? <Ico.sun/> : <Ico.moon/>}
          </button>
        </div>
      </div>

      <div className="case-tabs">
        {cases.map((c) => (
          <div
            key={c.id}
            className={"case-tab" + (c.id === activeCase ? " active" : "")}
            onClick={() => onActivate(c.id)}
          >
            <span className={"scenario-dot " + c.scenario}></span>
            <span>{c.name}</span>
            <span className="tick">{c.ticker}</span>
            <button
              className="close-x"
              onClick={(e) => { e.stopPropagation(); onClose(c.id); }}
              aria-label="Close case"
            >
              <Ico.close/>
            </button>
          </div>
        ))}
        <div className="new-case" onClick={onAdd} title="New case">
          <Ico.plus/>
        </div>
      </div>
    </header>
  );
}
