"use client";
import { useState } from "react";
import { Ico } from "./icons";
import type { AppUser } from "@/lib/user";
import { initialsOf } from "@/lib/user";

export function AuthScreen({ onLogin }: { onLogin: (u: AppUser) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("luca.schmidt@deal-desk.ai");
  const [password, setPassword] = useState("••••••••••");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Associate");
  const [firm, setFirm] = useState("");

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    onLogin({
      email,
      name: name || "Luca Schmidt",
      role,
      firm: firm || "Lakeshore Partners",
      initials: initialsOf(name || "Luca Schmidt"),
      plan: "Pro",
    });
  }

  function demo() {
    onLogin({
      email: "demo@deal-desk.ai",
      name: "Luca Schmidt",
      role: "Associate · M&A",
      firm: "Lakeshore Partners",
      initials: "LS",
      plan: "Pro",
    });
  }

  return (
    <div className="auth-screen">
      <div className="auth-side">
        <div className="auth-brand">
          <span className="brand-mark" style={{ width: 32, height: 32, fontSize: 18 }}>D</span>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>DealDesk AI</span>
        </div>

        <div className="auth-hero">
          <span className="eyebrow">For analysts, associates and dealmakers</span>
          <h1>The workbench for<br/><em>modern deal teams.</em></h1>
          <p>
            Triangulate DCF, trading comps and LBO returns in one place.
            Live market data, AI-drafted memos, and an audit trail your IC can trust.
          </p>
        </div>

        <ul className="auth-bullets">
          <li><span className="auth-tick"><Ico.check/></span> Live market data on 40+ public &amp; private companies</li>
          <li><span className="auth-tick"><Ico.check/></span> AI memo, peer suggestions &amp; PDF extraction</li>
          <li><span className="auth-tick"><Ico.check/></span> Team workspaces with case sharing and roles</li>
          <li><span className="auth-tick"><Ico.check/></span> One-click PowerPoint &amp; Excel export</li>
        </ul>

        <div className="auth-side-foot">
          <div className="auth-logos">
            <span>Trusted by analysts at</span>
            <div className="auth-logo-row">
              <span>LAKESHORE</span><span>·</span><span>BERENBERG</span><span>·</span><span>HOULIHAN</span><span>·</span><span>JEFFERIES</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button>
            <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === "signup" && (
              <>
                <div className="auth-field">
                  <label>Full name</label>
                  <input className="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe"/>
                </div>
                <div className="auth-row-2">
                  <div className="auth-field">
                    <label>Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                      <option>Analyst</option>
                      <option>Associate</option>
                      <option>Vice President</option>
                      <option>Director</option>
                      <option>Managing Director</option>
                      <option>Portfolio Manager</option>
                      <option>Consultant</option>
                    </select>
                  </div>
                  <div className="auth-field">
                    <label>Firm / team</label>
                    <input className="text" value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="Lakeshore Partners"/>
                  </div>
                </div>
              </>
            )}

            <div className="auth-field">
              <label>Work email</label>
              <input type="email" className="text" value={email} onChange={(e) => setEmail(e.target.value)}/>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
              {mode === "login" && (
                <a className="auth-forgot" href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
              )}
            </div>

            <button type="submit" className="btn primary auth-submit">
              {mode === "login" ? "Sign in to workspace" : "Create your workspace"}
              <span style={{ marginLeft: "auto" }}>→</span>
            </button>

            <div className="auth-or"><span>or</span></div>

            <div className="auth-sso">
              <button type="button" className="btn auth-sso-btn">
                <span className="sso-ico" style={{ background: "#0a66c2" }}>in</span>
                Continue with LinkedIn
              </button>
              <button type="button" className="btn auth-sso-btn">
                <span className="sso-ico" style={{ background: "linear-gradient(135deg,#ea4335,#fbbc05,#34a853,#4285f4)" }}>G</span>
                Continue with Google SSO
              </button>
              <button type="button" className="btn auth-sso-btn">
                <span className="sso-ico" style={{ background: "#000" }}></span>
                Continue with SAML / Okta
              </button>
            </div>

            <button type="button" className="auth-demo" onClick={demo}>
              <Ico.sparkle/>
              <span>Skip — explore with demo account</span>
              <span className="auth-demo-arrow">→</span>
            </button>
          </form>
        </div>

        <div className="auth-foot">
          <span>© 2026 DealDesk AI · Frankfurt · London · New York</span>
          <span style={{ marginLeft: "auto" }}>
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
            <span style={{ margin: "0 8px" }}>·</span>
            <a href="#" onClick={(e) => e.preventDefault()}>Terms</a>
            <span style={{ margin: "0 8px" }}>·</span>
            <a href="#" onClick={(e) => e.preventDefault()}>Status</a>
          </span>
        </div>
      </div>
    </div>
  );
}
