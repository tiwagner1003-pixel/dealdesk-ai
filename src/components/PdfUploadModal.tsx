"use client";

import { useEffect, useState } from "react";
import { Ico } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
};

export function PdfUploadModal({ open, onClose, onApply }: Props) {
  const [stage, setStage] = useState<"idle" | "uploading" | "extracting" | "done">("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (stage === "uploading") {
      const id = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) { clearInterval(id); setStage("extracting"); return 100; }
          return p + 12;
        });
      }, 180);
      return () => clearInterval(id);
    }
    if (stage === "extracting") {
      const t = setTimeout(() => setStage("done"), 2200);
      return () => clearTimeout(t);
    }
  }, [stage]);

  function reset() { setStage("idle"); setProgress(0); }
  function close() { reset(); onClose(); }
  function apply() { onApply(); reset(); onClose(); }

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>Import financial filing</h3>
            <span className="head-aux" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              AI extracts metrics into the model
            </span>
          </div>
          <button className="icon-btn" onClick={close}><Ico.close/></button>
        </div>

        <div className="modal-body">
          {stage === "idle" && (
            <div className="drop-zone">
              <div className="ico"><Ico.upload/></div>
              <h4>Drop annual report or investor deck</h4>
              <p>PDF up to 50 MB · 10-K, 20-F, earnings transcript, investor presentation</p>
              <button className="browse" onClick={() => setStage("uploading")}>Browse files</button>
              <p style={{ marginTop: 16, fontSize: 11 }}>
                Or paste a URL · supported: SEC EDGAR, Annual Reports, IR pages
              </p>
            </div>
          )}

          {(stage === "uploading" || stage === "extracting" || stage === "done") && (
            <>
              <div className="extract-row">
                <div className="file-ico">PDF</div>
                <div className="meta">
                  <span className="name">adyen-q3-2025-results.pdf</span>
                  <span className="sub">
                    {stage === "uploading" && `Uploading · ${progress}%`}
                    {stage === "extracting" && "Extracting financial data · Claude-ready parser"}
                    {stage === "done" && "Extraction complete · 12 metrics found"}
                  </span>
                  <div className="bar">
                    <div style={{ width: (stage === "done" || stage === "extracting" ? 100 : progress) + "%" }}/>
                  </div>
                </div>
                {stage === "extracting" && <span className="spin" style={{ fontSize: 14 }}>⟳</span>}
                {stage === "done" && <Ico.check style={{ color: "var(--green)" }}/>}
              </div>

              {stage === "done" && (
                <div className="extract-summary">
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
                    Extracted metrics — review and apply
                  </div>
                  {[
                    ["Revenue (FY24A)", "1,850 EURm", "p. 14"],
                    ["EBITDA margin", "47.2%", "p. 16"],
                    ["Net debt", "−2,300 EURm", "p. 22"],
                    ["Shares outstanding", "31.0m", "p. 87"],
                    ["Capex / Revenue", "5.1%", "p. 24"],
                    ["Tax rate", "25.0%", "p. 31"],
                  ].map((row, i) => (
                    <div key={i} className="row">
                      <span className="check"><Ico.check/></span>
                      <span>{row[0]}</span>
                      <span>
                        <span className="val">{row[1]}</span>
                        <span className="src">· {row[2]}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-foot">
          <span className="head-aux" style={{ fontSize: 11.5, fontFamily: "var(--font-mono)" }}>
            {stage === "done"
              ? "All metrics will overwrite the current model. Review per-field after applying."
              : "Citations are stored with each metric for audit trail."}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={close}>Cancel</button>
            <button
              className="btn primary"
              disabled={stage !== "done"}
              onClick={apply}
              style={stage !== "done" ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              Apply to model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
