"use client";
import { useState } from "react";
import { Ico } from "./icons";
import type { AppUser } from "@/lib/user";

type Tab = "profile" | "team" | "subscription" | "branding" | "activity";

export function AccountDrawer({
  open, onClose, user, onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: AppUser;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>("profile");
  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-avatar">{user.initials}</div>
          <div className="drawer-id">
            <span className="drawer-name">{user.name}</span>
            <span className="drawer-sub">{user.role} · {user.firm}</span>
          </div>
          <button className="icon-btn" onClick={onClose}><Ico.close/></button>
        </div>

        <div className="drawer-nav">
          <TabBtn id="profile"      label="Profile"      tab={tab} setTab={setTab}/>
          <TabBtn id="team"         label="Team"         tab={tab} setTab={setTab} badge="4"/>
          <TabBtn id="subscription" label="Subscription" tab={tab} setTab={setTab}/>
          <TabBtn id="branding"     label="Branding"     tab={tab} setTab={setTab}/>
          <TabBtn id="activity"     label="Activity"     tab={tab} setTab={setTab}/>
        </div>

        <div className="drawer-body">
          {tab === "profile"      && <ProfileTab user={user}/>}
          {tab === "team"         && <TeamTab/>}
          {tab === "subscription" && <SubscriptionTab/>}
          {tab === "branding"     && <BrandingTab/>}
          {tab === "activity"     && <ActivityTab/>}
        </div>

        <div className="drawer-foot">
          <button className="btn" onClick={onLogout}>Sign out</button>
          <span className="muted num" style={{ fontSize: 11, marginLeft: "auto" }}>v4.2.1 · build 2026.05.27</span>
        </div>
      </aside>
    </div>
  );
}

function TabBtn({ id, label, tab, setTab, badge }: { id: Tab; label: string; tab: Tab; setTab: (t: Tab) => void; badge?: string }) {
  return (
    <button className={"drawer-tab" + (tab === id ? " active" : "")} onClick={() => setTab(id)}>
      {label}
      {badge && <span className="drawer-tab-badge">{badge}</span>}
    </button>
  );
}

function ProfileTab({ user }: { user: AppUser }) {
  return (
    <div className="drawer-section">
      <h3>Personal details</h3>
      <div className="drawer-field-grid">
        <Field label="Full name" value={user.name}/>
        <Field label="Email" value={user.email}/>
        <Field label="Role" value={user.role}/>
        <Field label="Firm" value={user.firm}/>
        <Field label="Time zone" value="Europe/Frankfurt (CET)"/>
        <Field label="Default currency" value="EUR"/>
      </div>

      <h3 style={{ marginTop: 24 }}>Notifications</h3>
      <div className="drawer-toggle-list">
        <Toggle label="Daily digest — open cases & memos" on/>
        <Toggle label="Comments on cases I author" on/>
        <Toggle label="@mentions in any case" on/>
        <Toggle label="Market alerts on watchlist" on={false}/>
        <Toggle label="Weekly product updates" on={false}/>
      </div>

      <h3 style={{ marginTop: 24 }}>API keys (Bring your own)</h3>
      <div className="drawer-api">
        <ApiRow name="OpenAI"             keyStr="sk-proj-••••••••••••••••3a72" status="Active"/>
        <ApiRow name="Anthropic"          keyStr="sk-ant-••••••••••••••••8f14" status="Active"/>
        <ApiRow name="FactSet / Bloomberg" keyStr="Not connected" status="" cta="Connect"/>
      </div>
    </div>
  );
}

function ApiRow({ name, keyStr, status, cta }: { name: string; keyStr: string; status: string; cta?: string }) {
  return (
    <div className="drawer-api-row">
      <div className="drawer-api-l">
        <span className="drawer-api-name">{name}</span>
        <span className="drawer-api-key">{keyStr}</span>
      </div>
      {status && <span className="status-pill status-approved">{status}</span>}
      {cta
        ? <button className="btn primary" style={{ height: 28, fontSize: 11.5 }}>{cta}</button>
        : <button className="btn" style={{ height: 28, fontSize: 11.5 }}>Rotate</button>}
    </div>
  );
}

function TeamTab() {
  const members = [
    { name: "Luca Schmidt",     role: "Associate · M&A",      initials: "LS", email: "luca@lakeshore-partners.de",   status: "Online",  permission: "Admin" },
    { name: "Anna Vogel",       role: "Analyst · Sector",     initials: "AV", email: "anna@lakeshore-partners.de",   status: "Online",  permission: "Editor" },
    { name: "Sebastian Krüger", role: "Vice President · M&A", initials: "SK", email: "seb@lakeshore-partners.de",    status: "Idle 5m", permission: "Editor" },
    { name: "Marie Forster",    role: "Director · Buyside",   initials: "MF", email: "marie@lakeshore-partners.de",  status: "Offline", permission: "Editor" },
    { name: "Tobias Reinhardt", role: "MD · Head of M&A",     initials: "TR", email: "tobias@lakeshore-partners.de", status: "Offline", permission: "Viewer" },
  ];
  return (
    <div className="drawer-section">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Workspace · Lakeshore Partners</h3>
        <button className="btn primary" style={{ height: 30, fontSize: 12.5 }}><Ico.plus/> Invite member</button>
      </div>
      <div className="team-stats">
        <div><span className="l">Seats used</span><span className="v">5 / 12</span></div>
        <div><span className="l">Plan</span><span className="v">Pro · €99 / seat</span></div>
        <div><span className="l">Renews</span><span className="v">14 Aug 2026</span></div>
      </div>
      <table className="data-table" style={{ marginTop: 16 }}>
        <thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Permission</th><th/></tr></thead>
        <tbody>
          {members.map((m, i) => (
            <tr key={i}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="team-avatar">{m.initials}</div>
                  <div style={{ display: "grid" }}>
                    <span style={{ fontWeight: 500 }}>{m.name}</span>
                    <span className="muted" style={{ fontSize: 11 }}>{m.email}</span>
                  </div>
                </div>
              </td>
              <td className="muted">{m.role}</td>
              <td>
                <span className="status-dot">
                  <span className={"sd " + (m.status === "Online" ? "on" : m.status.startsWith("Idle") ? "idle" : "off")}/>
                  {m.status}
                </span>
              </td>
              <td>
                <select defaultValue={m.permission}
                  style={{ background: "var(--panel-soft)", border: "1px solid var(--line)", borderRadius: 4, padding: "3px 6px", fontSize: 11.5 }}>
                  <option>Admin</option><option>Editor</option><option>Viewer</option>
                </select>
              </td>
              <td className="actions"><button className="icon-btn"><Ico.trash/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubscriptionTab() {
  return (
    <div className="drawer-section">
      <div className="plan-current">
        <div>
          <span className="eyebrow">Current plan</span>
          <div className="plan-name">Pro · annual</div>
          <span className="muted" style={{ fontSize: 12 }}>€99 per seat · 5 seats · €5,940 / year</span>
        </div>
        <div className="plan-renewal">
          <span className="eyebrow">Renews</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>14 Aug 2026</span>
        </div>
      </div>

      <h3 style={{ marginTop: 8 }}>Compare plans</h3>
      <div className="plan-grid">
        <PlanCard name="Free" price="€0" period="/seat · forever"
          items={["3 cases · 1 seat", "DCF + trading comps", "Watchlist · 10 tickers"]}
          off={["No AI memo · no PDF import", "No team sharing"]}
          cta="Downgrade"/>
        <PlanCard name="Pro" price="€99" period="/seat · month" current
          items={["Unlimited cases", "DCF · Comps · LBO · Sensitivity", "AI memo & PDF extraction", "Live market data · 40+ tickers", "Team workspaces & sharing", "PowerPoint & Excel export"]}
          cta="Current plan"/>
        <PlanCard name="Enterprise" price="Custom" period="" highlight
          items={["Everything in Pro", "SSO / SAML · Okta · Azure AD", "Custom branding & deck templates", "Audit log · SOC 2 · GDPR DPA", "FactSet / Bloomberg integration", "Dedicated CS & onboarding"]}
          cta="Contact sales"/>
      </div>

      <h3 style={{ marginTop: 24 }}>Billing</h3>
      <div className="billing-list">
        <BillingRow date="14 Aug 2025" desc="Pro plan · 5 seats · annual"          amount="€5,940.00"/>
        <BillingRow date="14 Feb 2025" desc="Pro plan · pro-rata · 2 new seats"     amount="€990.00"/>
        <BillingRow date="14 Aug 2024" desc="Pro plan · 3 seats · annual"          amount="€3,564.00"/>
      </div>
    </div>
  );
}

function PlanCard({ name, price, period, items, off = [], cta, current, highlight }: {
  name: string; price: string; period: string;
  items: string[]; off?: string[]; cta: string;
  current?: boolean; highlight?: boolean;
}) {
  return (
    <div className={"plan-card" + (current ? " current" : "") + (highlight ? " highlight" : "")}>
      <div className="plan-card-head">
        <span className="plan-card-name">{name}{current && <span className="plan-current-tag">CURRENT</span>}</span>
        <span className="plan-card-price">{price}{period && <span>{period}</span>}</span>
      </div>
      <ul>
        {items.map((it) => <li key={it}><Ico.check/> {it}</li>)}
        {off.map((it) => <li key={it} style={{ opacity: 0.4 }}><Ico.close/> {it}</li>)}
      </ul>
      {current
        ? <button className="btn primary" disabled style={{ opacity: 0.6 }}>{cta}</button>
        : highlight
        ? <button className="btn primary">{cta}</button>
        : <button className="btn">{cta}</button>}
    </div>
  );
}

function BillingRow({ date, desc, amount }: { date: string; desc: string; amount: string }) {
  return (
    <div className="billing-row">
      <span className="num muted" style={{ fontSize: 11, width: 100 }}>{date}</span>
      <span style={{ flex: 1 }}>{desc}</span>
      <span className="num">{amount}</span>
      <span className="status-pill status-approved" style={{ minWidth: 60 }}>Paid</span>
    </div>
  );
}

function BrandingTab() {
  return (
    <div className="drawer-section">
      <h3>Export branding</h3>
      <p className="muted" style={{ fontSize: 12.5, margin: "0 0 16px" }}>
        These appear on PowerPoint and PDF exports. The DealDesk watermark is removed at the Pro tier.
      </p>

      <div className="brand-logo-zone">
        <div className="brand-logo-prev">
          <div className="brand-logo-mark">LP</div>
          <span style={{ fontWeight: 600 }}>Lakeshore Partners</span>
        </div>
        <button className="btn"><Ico.upload/> Replace logo</button>
      </div>

      <div className="drawer-field-grid" style={{ marginTop: 18 }}>
        <Field label="Firm name" value="Lakeshore Partners" editable/>
        <Field label="Tagline" value="Strategic M&A & Capital Advisory" editable/>
        <Field label="Disclaimer line" value="For internal use only. Not for distribution." editable/>
        <Field label="Primary colour" value="#0B1F3A" color="#0B1F3A" editable/>
        <Field label="Accent colour" value="#B7791F" color="#B7791F" editable/>
        <Field label="Cover photo" value="cover-frankfurt-skyline.jpg" editable/>
      </div>

      <h3 style={{ marginTop: 24 }}>Deck template</h3>
      <div className="deck-templates">
        {[
          { id: "ic",      name: "IC Pitch · 12 slides", desc: "Cover · Thesis · Valuation · Football field · Memo · Risks" },
          { id: "tease",   name: "Teaser · 6 slides",    desc: "One-pager + supporting visuals" },
          { id: "fullinfo",name: "CIM · 28 slides",      desc: "Full info memo · sections, charts, exhibits" },
        ].map((tpl, i) => (
          <div key={tpl.id} className={"deck-tpl-row" + (i === 0 ? " active" : "")}>
            <div className="deck-tpl-icon">{i === 0 ? <Ico.check/> : null}</div>
            <div className="deck-tpl-body">
              <span style={{ fontWeight: 500 }}>{tpl.name}</span>
              <span className="muted" style={{ fontSize: 11.5 }}>{tpl.desc}</span>
            </div>
            <button className="btn" style={{ height: 28, fontSize: 11.5 }}>Preview</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityTab() {
  const events = [
    { type: "edit",    who: "Anna Vogel",         what: "edited Stripe valuation",    detail: "WACC 9.5% → 9.0%",                                              time: "14:08", date: "Today" },
    { type: "comment", who: "Sebastian Krüger",   what: "commented on Adyen memo",    detail: "“Re-check terminal value share — feels low.”",                  time: "13:42", date: "Today" },
    { type: "create",  who: "Luca Schmidt",       what: "created LBO case · Klarna",  detail: "Hold 5y · entry 14x · exit 13x",                                time: "11:08", date: "Today" },
    { type: "share",   who: "Marie Forster",      what: "shared Novo Nordisk memo",   detail: "→ external recipient: ic@lakeshore-partners.de",                time: "09:18", date: "Today" },
    { type: "export",  who: "Luca Schmidt",       what: "exported PowerPoint",        detail: "Adyen · IC Pitch · 12 slides",                                  time: "16:42", date: "Yesterday" },
    { type: "edit",    who: "Anna Vogel",         what: "added 3 peers to LVMH case", detail: "Hermès · Kering · Richemont",                                   time: "15:30", date: "Yesterday" },
    { type: "create",  who: "Luca Schmidt",       what: "imported PDF · Adyen Q3 2025", detail: "12 metrics extracted via AI",                                  time: "12:30", date: "Yesterday" },
    { type: "approve", who: "Tobias Reinhardt",   what: "approved BlackRock memo",    detail: "BUY · Outperform — moved to IC stage",                          time: "10:14", date: "Yesterday" },
  ];

  let lastDate = "";
  const glyph: Record<string, string> = { edit: "✎", comment: "💬", create: "+", share: "↗", export: "↓", approve: "✓" };

  return (
    <div className="drawer-section">
      <h3>Workspace activity</h3>
      <div className="activity-feed">
        {events.map((e, i) => {
          const showDay = e.date !== lastDate;
          lastDate = e.date;
          return (
            <div key={i}>
              {showDay && <div className="activity-day"><span>{e.date}</span></div>}
              <div className="activity-row">
                <div className={"activity-ico activity-" + e.type}>{glyph[e.type]}</div>
                <div className="activity-body">
                  <div className="activity-headline">
                    <strong>{e.who}</strong> <span style={{ color: "var(--muted)" }}>{e.what}</span>
                  </div>
                  <div className="activity-detail">{e.detail}</div>
                </div>
                <span className="activity-time num">{e.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value, color, editable }: { label: string; value: string; color?: string; editable?: boolean }) {
  return (
    <div className="drawer-field">
      <label>{label}</label>
      <div className="drawer-field-val">
        {color && <span className="brand-swatch" style={{ background: color }}/>}
        {editable ? <input className="text" defaultValue={value}/> : <span>{value}</span>}
      </div>
    </div>
  );
}

function Toggle({ label, on }: { label: string; on: boolean }) {
  const [v, setV] = useState(on);
  return (
    <div className="drawer-toggle" onClick={() => setV(!v)}>
      <span>{label}</span>
      <span className={"toggle-switch" + (v ? " on" : "")}><span className="knob"/></span>
    </div>
  );
}
