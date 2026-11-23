# DealDesk

**A browser-based valuation workbench: DCF, trading comps, a sponsor-view LBO and an investment memo — for listed and private companies, in one workflow.**

Live demo: **https://dealdesk-ai-cyan.vercel.app** · Methodology: [/methodology](https://dealdesk-ai-cyan.vercel.app/methodology)

No sign-up. Cases are stored in your browser; nothing is sent to a server except the optional AI requests.

---

## What it does

A case runs through six steps, each a tab in the workspace:

| Step | What happens |
|---|---|
| **01 Case setup** | Pick a listed company from the market database (~80 names, US/EU) or start a blank private-company case. |
| **02 Operating model** | Five-year forecast of revenue growth, EBITDA margin, D&A, capex, working capital and tax; WACC and terminal growth. |
| **03 Peer group** | Editable peer set with EV/Revenue and EV/EBITDA; peers can be included or excluded individually. |
| **04 Valuation** | DCF with Gordon-growth and exit-multiple terminal values, comps on the peer median, blended value, football field and a WACC × terminal-growth sensitivity grid. |
| **05 LBO** | Sponsor view on the same operating case: entry/exit multiple, leverage, cost of debt, hold period → IRR, MOIC, debt paydown and a value-creation bridge. |
| **06 Memo** | Investment memo draft from the model figures (Claude if an API key is configured, rule-based otherwise); export to Excel and PowerPoint. |

Around the workflow: a dashboard with a live watchlist, a case library, side-by-side case comparison, and a co-pilot that answers questions about the open case.

## Valuation logic in brief

- **Free cash flow** = EBIT × (1 − tax) + D&A − capex − ΔNWC, with NWC investment as a share of incremental revenue.
- **DCF**: five explicit years discounted at WACC (end-of-year). Terminal value is the average of Gordon growth and an exit multiple on final-year EBITDA.
- **Comps**: median EV/Revenue and EV/EBITDA of the included peers, applied to the target's LTM figures.
- **Blended EV** = mean of DCF, EV/Revenue and EV/EBITDA; equity value = EV − net debt; per-share value only for listed companies.
- **LBO**: entry at the market EV/EBITDA for listed targets (a sponsor does not buy below the share price), otherwise at the peer median. Debt sized at 5.5× EBITDA, one tranche with a full cash sweep and revolver for negative years. Exit at the entry multiple by default — no multiple expansion assumed. The bridge splits equity gains into EBITDA growth, multiple change and deleveraging and sums exactly to the exit equity.

Every formula, its assumptions and the known limitations are written out on the [methodology page](https://dealdesk-ai-cyan.vercel.app/methodology).

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- Valuation engine in plain TypeScript (`src/lib/finance.ts`, `src/lib/lbo.ts`), no runtime dependencies, unit-tested with `node --test`
- Excel export with formatting via `xlsx-js-style`, PowerPoint export via `pptxgenjs` — both generated client-side
- **Anthropic Claude** for memo drafting and co-pilot answers; both AI routes falls back to a rule-based answer if no key is set or the API call fails
- Market data: Twelve Data / FMP if keys are configured, Yahoo Finance otherwise, with a static snapshot as last resort; charts via TradingView, loaded only on consent
- Deployed on Vercel; GitHub Actions runs typecheck, tests and build on every push

## Project structure

```
src/
  app/
    page.tsx                 Workspace (dashboard, cases, workflow)
    methodology/             Methodology page
    api/
      market-data/           Quotes: Twelve Data → FMP → Yahoo → snapshot
      price-history/         Chart series for the watchlist
      ai-memo/, ai-chat/     Claude with rule-based fallback
  components/                UI: workflow panels, LBO panel, rails, charts
  lib/
    finance.ts               Forecast, FCF, DCF, comps, blending, sensitivities
    lbo.ts                   LBO engine and case-derived defaults
    *.test.ts                Unit tests for both engines
    exportExcel.ts           Formatted multi-sheet Excel model (incl. LBO)
    exportPpt.ts             PowerPoint deck
    marketDb.ts              Market database snapshot
    server/yahoo.ts          Yahoo chart client with caching and minor-unit handling
```

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Checks (the same ones CI runs):

```bash
npm run typecheck
npm test
npm run build
```

Requires Node 22.18 or later (CI runs Node 24); the tests use Node's built-in TypeScript type stripping.

### Environment variables

All optional — without any of them the app runs fully, with rule-based AI answers and Yahoo / snapshot market data. Put them in `.env.local`:

| Variable | Used for |
|---|---|
| `ANTHROPIC_API_KEY` | Memo drafting and co-pilot answers with Claude |
| `TWELVE_DATA_API_KEY` | Primary source for live quotes |
| `FMP_API_KEY` | Secondary source for live quotes |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata and the Open Graph image |

## Data and limitations

- The market database is a snapshot (Yahoo Finance, November 2026). Live quotes replace it where a source responds; otherwise the interface marks prices as sample prices.
- Unlisted companies (e.g. Stripe, OpenAI) carry estimates from public reporting and are valued without a share price.
- The DCF uses end-of-year discounting and a constant WACC; the LBO has one debt tranche, no fees and no minimum cash. The full list is on the methodology page.

DealDesk is an educational project. Nothing in it is investment advice.
