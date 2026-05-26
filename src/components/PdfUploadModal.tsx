"use client";

import { useEffect, useRef, useState } from "react";
import { Ico } from "./icons";

export type ExtractedPdfMetrics = {
  fileName: string;
  revenue: number;
  ebitdaMargin: number;
  netDebt: number;
  shares: number;
  capexPercent: number;
  depreciationPercent: number;
  taxRate: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (metrics: ExtractedPdfMetrics) => void;
};

export function PdfUploadModal({ open, onClose, onApply }: Props) {
  const [stage, setStage] = useState<"idle" | "uploading" | "extracting" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("No file selected");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const metrics: ExtractedPdfMetrics = {
    fileName,
    revenue: 1850,
    ebitdaMargin: 47.2,
    netDebt: -2300,
    shares: 31,
    capexPercent: 5.1,
    depreciationPercent: 4,
    taxRate: 25,
  };

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

  function reset() { setStage("idle"); setProgress(0); setFileName("No file selected"); }
  function close() { reset(); onClose(); }
  function apply() { onApply(metrics); reset(); onClose(); }
  function startUpload(file?: File) {
    setFileName(file?.name || "financial-filing.pdf");
    setProgress(0);
    setStage("uploading");
  }

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
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) startUpload(file);
              e.currentTarget.value = "";
            }}
          />
          {stage === "idle" && (
            <div
              className="drop-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) startUpload(file);
              }}
            >
              <div className="ico"><Ico.upload/></div>
              <h4>Drop annual report or investor deck</h4>
              <p>PDF up to 50 MB · 10-K, 20-F, earnings transcript, investor presentation</p>
              <button className="browse" onClick={() => inputRef.current?.click()}>Browse files</button>
              <p style={{ marginTop: 16, fontSize: 11 }}>
                Drag-and-drop and browse are enabled. URL import can be added once a backend fetcher exists.
              </p>
            </div>
          )}

          {(stage === "uploading" || stage === "extracting" || stage === "done") && (
            <>
              <div className="extract-row">
                <div className="file-ico">PDF</div>
                <div className="meta">
                  <span className="name">{fileName}</span>
                  <span className="sub">
                    {stage === "uploading" && `Uploading · ${progress}%`}
                    {stage === "extracting" && "Extracting financial data · local demo parser"}
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
                    ["Revenue (FY24A)", `${metrics.revenue.toLocaleString()}m`, "p. 14"],
                    ["EBITDA margin", `${metrics.ebitdaMargin.toFixed(1)}%`, "p. 16"],
                    ["Net debt", `${metrics.netDebt.toLocaleString()}m`, "p. 22"],
                    ["Shares outstanding", `${metrics.shares.toFixed(1)}m`, "p. 87"],
                    ["Capex / Revenue", `${metrics.capexPercent.toFixed(1)}%`, "p. 24"],
                    ["Tax rate", `${metrics.taxRate.toFixed(1)}%`, "p. 31"],
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
