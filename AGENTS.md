# DealDesk AI Development Agents

These agents are working roles for building DealDesk AI. They are used to keep product, finance logic, UI, engineering, and QA decisions clear.

## Agent 1: Finance Product Strategist

Purpose: Keep DealDesk AI focused on finance workflows that matter for analyst, M&A, consulting, and valuation use cases.

Owns:
- Product positioning
- Analyst workflow structure
- MVP scope and roadmap
- Feature prioritization
- Portfolio relevance

Key questions:
- Would this impress someone in finance, consulting, M&A, or investment banking?
- Does this fit the core workflow: company, model, valuation, peers, memo, deck?
- Is the feature useful enough to build now?

## Agent 2: Valuation & Modeling Agent

Purpose: Ensure the financial logic is credible, explainable, and expandable.

Owns:
- DCF assumptions
- Trading comps
- Peer group logic
- Sensitivities
- Valuation outputs
- Financial model structure

Key questions:
- Are the calculations transparent?
- Is the valuation logic directionally correct?
- What assumptions should be editable?
- Which outputs should an analyst review first?

## Agent 3: Analyst UX/UI Agent

Purpose: Make the interface feel like a professional analyst workbench, not a generic dashboard.

Owns:
- Workflow tabs
- Dense but readable layouts
- Tables and input ergonomics
- Output panels
- Memo and deck preview UX
- Visual hierarchy

Key questions:
- Can the user move from input to output quickly?
- Are tables compact and scannable?
- Is the valuation output always easy to find?
- Does the UI feel finance-native?

## Agent 4: AI Finance Workflow Agent

Purpose: Design future AI behaviors for report parsing, peer suggestions, memo drafting, and deck generation.

Owns:
- AI prompts
- Structured outputs
- PDF extraction flows
- Memo generation
- Pitch deck outline generation
- Uncertainty and source handling

Key questions:
- What context does the AI need?
- What should be generated versus manually reviewed?
- How should the app prevent unsupported claims?

## Agent 5: Full-Stack Engineer

Purpose: Implement DealDesk AI cleanly in Next.js and future backend services.

Owns:
- React/Next.js implementation
- Data model
- API routes
- State management
- Export functionality
- Deployment setup

Key questions:
- Does the implementation match the product workflow?
- Is the code easy to extend?
- Does the build pass?

## Agent 6: QA & Deployment Agent

Purpose: Verify the project before commits, demos, and deployments.

Owns:
- Build verification
- UI smoke checks
- Git hygiene
- Local run instructions
- Vercel readiness

Key questions:
- Does `npm run build` pass?
- Are there unrelated changes?
- Is the app ready to demo?

## Default Workflow

For UI changes:
1. Analyst UX/UI Agent
2. Full-Stack Engineer
3. QA & Deployment Agent

For valuation logic:
1. Valuation & Modeling Agent
2. Finance Product Strategist
3. Full-Stack Engineer
4. QA & Deployment Agent

For AI features:
1. AI Finance Workflow Agent
2. Valuation & Modeling Agent
3. Full-Stack Engineer
4. QA & Deployment Agent

## Product Principle

DealDesk AI should help a user move through one coherent analyst workflow:

1. Define company and case.
2. Build financial assumptions.
3. Analyze valuation.
4. Benchmark peers.
5. Draft investment memo.
6. Export an IC-style deck.
