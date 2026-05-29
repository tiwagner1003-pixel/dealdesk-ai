# DealDesk AI

DealDesk AI is a finance analyst workbench for company analysis, financial modeling, valuation, peer groups, and investment memo creation.

The goal is to build a portfolio-grade project with direct relevance to finance, M&A, consulting, valuation, and investment banking workflows.

## MVP Scope

The first version includes:

- Company case setup
- Editable financial model assumptions
- DCF-style enterprise value calculation
- Trading comps using peer EV/Revenue and EV/EBITDA multiples
- Editable peer group table
- Five-year projection table
- Blended valuation output
- Investment memo preview

## Product Direction

The intended workflow:

1. Enter company and case information.
2. Build or import financial assumptions.
3. Review DCF and trading comps valuation.
4. Build a peer group.
5. Generate an investment memo.
6. Export a pitch deck or PowerPoint.

## Future Features

- PDF upload for annual reports and investor presentations
- AI-based financial statement extraction
- Peer group suggestions by sector, geography, size, and margin profile
- Sensitivity tables
- Football field valuation chart
- Investment memo generation with citations
- PowerPoint export
- Supabase persistence
- Vercel deployment

## Development Agents

`AGENTS.md` defines the project roles for building DealDesk AI:

- Finance Product Strategist
- Valuation & Modeling Agent
- Analyst UX/UI Agent
- AI Finance Workflow Agent
- Full-Stack Engineer
- QA & Deployment Agent

These are development roles, not user-facing app agents. They help structure future product decisions and implementation work.

## Local Setup

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build check:

```bash
npm run build
```

Optional market data keys in `.env.local`:

```bash
TWELVE_DATA_API_KEY=your_twelve_data_key
FMP_API_KEY=your_fmp_key
SEC_USER_AGENT="DealDesk AI contact@example.com"
```

`/api/market-data` uses Twelve Data first, then FMP if configured, then Stooq/Yahoo fallbacks so the demo still works without keys. Responses are cached for five minutes and the UI shows whether data is live or a fallback.

## Positioning

DealDesk AI is designed as a focused finance project, separate from Study AI.

It should demonstrate:

- Finance workflow understanding
- Modeling and valuation logic
- Product thinking for analyst tools
- Clean UI for dense financial information
- A path toward AI-assisted finance workflows
