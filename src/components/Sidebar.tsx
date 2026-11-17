"use client";
import React from "react";
import { Icons } from "./icons";

type View = "dashboard" | "library" | "workspace";

export function Sidebar({
  view, setView, onSearch, onTemplates, onAccount, onTheme, theme, initials,
}: {
  view: View;
  setView: (v: View) => void;
  onSearch: () => void;
  onTemplates: () => void;
  onAccount?: () => void;   // Konto-System ruht — ohne Handler kein Kontoknopf
  onTheme: () => void;
  theme: "light" | "dark";
  initials?: string;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">D</span>
      </div>

      <nav className="sidebar-nav">
        <SidebarBtn
          label="Dashboard"
          active={view === "dashboard"}
          onClick={() => setView("dashboard")}
          icon={
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="5" height="6" rx="1"/>
              <rect x="9" y="2" width="5" height="4" rx="1"/>
              <rect x="2" y="10" width="5" height="4" rx="1"/>
              <rect x="9" y="8" width="5" height="6" rx="1"/>
            </svg>
          }
        />
        <SidebarBtn
          label="Cases"
          active={view === "library"}
          onClick={() => setView("library")}
          icon={
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="3" height="10" rx="0.5"/>
              <rect x="6" y="3" width="3" height="10" rx="0.5"/>
              <rect x="10" y="3" width="3" height="10" rx="0.5"/>
            </svg>
          }
        />
        <SidebarBtn
          label="Workspace"
          active={view === "workspace"}
          onClick={() => setView("workspace")}
          icon={
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4h12M2 8h12M2 12h7"/>
            </svg>
          }
        />

        <div className="sidebar-divider"/>

        <SidebarBtn label="Search" onClick={onSearch} icon={<Icons.search/>}/>
        <SidebarBtn label="Templates" onClick={onTemplates} icon={<Icons.sparkle/>}/>
      </nav>

      <div style={{ flex: 1 }}/>

      <div className="sidebar-foot">
        <button className="sidebar-btn" onClick={onTheme} title="Toggle theme">
          {theme === "dark" ? <Icons.sun/> : <Icons.moon/>}
        </button>
        {onAccount && (
          <button className="sidebar-btn" onClick={onAccount} title="Account">
            <div className="avatar" style={{ width: 26, height: 26 }}>{initials}</div>
          </button>
        )}
      </div>
    </aside>
  );
}

function SidebarBtn({
  icon, label, active, onClick, badge,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}) {
  return (
    <button
      className={"sidebar-btn" + (active ? " active" : "")}
      onClick={onClick}
      title={label}
    >
      <span className="sb-icon">{icon}</span>
      <span className="sb-label">{label}</span>
      {badge ? <span className="sb-badge">{badge}</span> : null}
    </button>
  );
}
