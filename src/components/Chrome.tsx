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
  onImportExcel: () => void;
  onCompare: () => void;
  compareOn: boolean;
  onSearch: () => void;
  onSave: () => void;
  savedLabel: string;
  notificationsOpen: boolean;
  onNotifications: () => void;
};

export function Chrome({
  cases, activeCase, onActivate, onClose, onAdd,
  theme, onTheme, onUpload, onImportExcel, onCompare, compareOn,
  onSearch, onSave, savedLabel, notificationsOpen, onNotifications,
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

        <div
          className="chrome-cmdk"
          role="button"
          tabIndex={0}
          onClick={onSearch}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSearch()}
        >
          <Ico.search className="chrome-cmdk-icon"/>
          <span className="chrome-cmdk-text">Search company, ticker or memo…</span>
          <span className="chrome-cmdk-kbd">⌘K</span>
        </div>

        <div className="chrome-actions">
          <button className="chip-button" onClick={onUpload}>
            <Ico.upload/>
            Upload PDF
          </button>
          <button className="chip-button" onClick={onImportExcel}>
            <Ico.download/>
            Import Excel
          </button>
          <button className={"chip-button" + (compareOn ? " active" : "")} onClick={onCompare}>
            <Ico.compare/>
            Compare cases
          </button>
          <button className="chip-button" onClick={onSave}>
            <span className="dot"></span>
            {savedLabel}
          </button>
          <button className="icon-btn" aria-label="Notifications" onClick={onNotifications}>
            <Ico.bell/>
          </button>
          {notificationsOpen && (
            <div
              style={{
                position: "absolute",
                right: 76,
                top: 46,
                zIndex: 30,
                width: 300,
                background: "var(--panel)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow-elev)",
                borderRadius: 8,
                padding: 12,
                display: "grid",
                gap: 10,
              }}
            >
              <span className="eyebrow">Notifications</span>
              {[
                ["Memo ready", "AI memo output is available in the Memo tab."],
                ["Model updated", "Latest assumptions are reflected in valuation outputs."],
                ["Local save", "Use Save to persist this workspace in your browser."],
              ].map((row) => (
                <div key={row[0]} style={{ display: "grid", gap: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>{row[0]}</span>
                  <span className="muted" style={{ fontSize: 11.5 }}>{row[1]}</span>
                </div>
              ))}
            </div>
          )}
          <button className="icon-btn" aria-label="Theme" onClick={onTheme}>
            {theme === "dark" ? <Ico.sun/> : <Ico.moon/>}
          </button>
          <div className="avatar">LS</div>
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
