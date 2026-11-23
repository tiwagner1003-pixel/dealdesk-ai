import { ImageResponse } from "next/og";

export const alt = "DealDesk — valuation workbench for DCF, comps and LBO";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Vorschaubild für geteilte Links — gebaut, nicht gepflegt: keine Zahlen, die veralten. */
export default function OpengraphImage() {
  const steps = ["Model", "Peers", "DCF", "Comps", "LBO", "Memo"];
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "72px 80px",
        background: "#0b1f3a", color: "#ffffff", fontFamily: "sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 12, background: "#ffffff", color: "#0b1f3a",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 700,
          }}>D</div>
          <div style={{ fontSize: 36, fontWeight: 600 }}>DealDesk</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1 }}>
            Value a company in one workspace.
          </div>
          <div style={{ fontSize: 30, color: "#b9c6da" }}>
            Five-year DCF, trading comps and LBO returns — exported to Excel and PowerPoint.
          </div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {steps.map((s, i) => (
            <div key={s} style={{
              display: "flex", padding: "10px 20px", borderRadius: 999, fontSize: 24,
              border: "1px solid #3b5278", color: i === 4 ? "#0b1f3a" : "#dbe4f1",
              background: i === 4 ? "#ffffff" : "transparent",
            }}>{s}</div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
