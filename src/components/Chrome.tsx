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
  onUpload: () => void;
  onCompare: () => void;
  compareOn: boolean;
};

export function Chrome({
  cases, activeCase, onActivate, onClose, onAdd,
  theme, onTheme, onUpload, onCompare, compareOn,
}: Props) {
  return (
    <header className="chrome">
      <div className="chrome-top">
        <div className="brand">
          <span className="brand-mark">D</span>
          <span>DealDesk AI</span>
          <span className="brand-divider"></span>
          <span className="brand-env">EU · Live</span>
        </div>

        <div className="chrome-cmdk" role="button" tabIndex={0}>
          <Ico.search className="chrome-cmdk-icon"/>
          <span className="chrome-cmdk-text">Search company, ticker or memo…</span>
          <span className="chrome-cmdk-kbd">⌘K</span>
        </div>

        <div className="chrome-actions">
          <button className="chip-button" onClick={onUpload}>
            <Ico.upload/>
            Upload PDF
          </button>
          <button className={"chip-button" + (compareOn ? " active" : "")} onClick={onCompare}>
            <Ico.compare/>
            Compare cases
          </button>
          <button className="chip-button">
            <span className="dot"></span>
            Saved · 2m ago
          </button>
          <button className="icon-btn" aria-label="Notifications">
            <Ico.bell/>
          </button>
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
