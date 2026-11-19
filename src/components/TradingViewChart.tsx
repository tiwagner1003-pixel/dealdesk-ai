"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FREIGABE_EVENT, freigabeGemerkt, setzeFreigabe } from "@/lib/tradingview";

const SKRIPT = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";

function aktuellesSchema(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/**
 * Kurschart von TradingView mit Zwei-Klick-Freigabe.
 *
 * Bis zum Klick wird nichts von TradingView geladen — erst danach erhält
 * TradingView die IP-Adresse. Die Quellenangabe unter dem Chart verlangen die
 * Nutzungsbedingungen von TradingView; sie bleibt stehen.
 */
export function TradingViewChart({ symbol, name, height }: { symbol: string; name: string; height: number }) {
  const [frei, setFrei] = useState(false);
  const [merken, setMerken] = useState(false);
  const [schema, setSchema] = useState<"light" | "dark">("light");
  const [geladen, setGeladen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Gemerkte Freigabe erst nach dem Einhängen lesen — beim Vorrendern gibt es keinen Speicher.
  useEffect(() => {
    setFrei(freigabeGemerkt());
    setSchema(aktuellesSchema());
    const beiWiderruf = () => { if (!freigabeGemerkt()) setFrei(false); };
    window.addEventListener(FREIGABE_EVENT, beiWiderruf);
    const beobachter = new MutationObserver(() => setSchema(aktuellesSchema()));
    beobachter.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { window.removeEventListener(FREIGABE_EVENT, beiWiderruf); beobachter.disconnect(); };
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!frei || !el) return;
    el.innerHTML = "";
    setGeladen(false);
    // Das Skript setzt einen iframe ein; erst dessen load-Ereignis heißt, dass etwas zu sehen ist.
    const fertig = () => setGeladen(true);
    const auf = new MutationObserver(() => {
      const rahmen = el.querySelector("iframe");
      if (rahmen) { rahmen.addEventListener("load", fertig, { once: true }); auf.disconnect(); }
    });
    auf.observe(el, { childList: true, subtree: true });
    const ziel = document.createElement("div");
    ziel.className = "tradingview-widget-container__widget";
    el.appendChild(ziel);
    const skript = document.createElement("script");
    skript.src = SKRIPT;
    skript.async = true;
    skript.type = "text/javascript";
    skript.textContent = JSON.stringify({
      symbols: [[name, `${symbol}|12M`]],
      chartOnly: false,
      width: "100%",
      height,
      locale: "en",
      colorTheme: schema,
      isTransparent: true,
      autosize: false,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: true,
      scalePosition: "right",
      scaleMode: "Normal",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "area",
      dateRanges: ["1d|1", "1m|30", "12m|1D", "60m|1W", "all|1M"],
    });
    el.appendChild(skript);
    return () => { auf.disconnect(); el.innerHTML = ""; };
  }, [frei, symbol, name, height, schema]);

  const seite = `https://www.tradingview.com/symbols/${symbol.replace(":", "-")}/`;

  if (!frei) {
    return (
      <div className="tv-gate" style={{ minHeight: height }}>
        <div className="tv-gate-inner">
          <span className="eyebrow">Price chart · TradingView</span>
          <p>
            No price history from our own sources right now. A delayed chart from
            TradingView can be shown instead. Loading it connects your browser to
            TradingView in the United States, which receives your IP address and may
            set cookies.
          </p>
          <div className="tv-gate-actions">
            <button className="btn primary" onClick={() => { setzeFreigabe(merken); setFrei(true); }}>
              Load chart
            </button>
            <label className="tv-gate-remember">
              <input type="checkbox" checked={merken} onChange={(e) => setMerken(e.target.checked)}/>
              Remember for this browser
            </label>
          </div>
          <Link className="tv-gate-link" href="/datenschutz#tradingview">Privacy details</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tv-chart">
      <div className="tv-frame" style={{ height }}>
        {!geladen && <div className="tv-loading">Loading chart from TradingView…</div>}
        <div className="tradingview-widget-container" ref={box} style={{ height, visibility: geladen ? "visible" : "hidden" }}/>
      </div>
      <div className="tradingview-widget-copyright tv-credit">
        <a href={seite} rel="noopener nofollow" target="_blank">{symbol.split(":")[1]} chart</a> by TradingView
        {" · "}
        <button className="tv-revoke" onClick={() => { setzeFreigabe(false); setFrei(false); }}>Unload</button>
      </div>
    </div>
  );
}

/** Widerruf der gemerkten Freigabe — für /datenschutz. */
export function ChartFreigabeWiderruf() {
  const [gemerkt, setGemerkt] = useState<boolean | null>(null);
  useEffect(() => setGemerkt(freigabeGemerkt()), []);
  if (gemerkt === null) return null;
  return gemerkt ? (
    <p>
      <button className="btn" onClick={() => { setzeFreigabe(false); setGemerkt(false); }}>
        Gespeicherte Freigabe widerrufen
      </button>
    </p>
  ) : (
    <p className="legal-small">In diesem Browser ist keine Freigabe gespeichert.</p>
  );
}
