import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology · DealDesk",
  description:
    "How DealDesk values a company: five-year DCF with two terminal values, trading comps on a filtered peer median, a sponsor-view LBO, and where the model stops.",
};

/**
 * Was gerechnet wird, in der Reihenfolge der Arbeitsschritte. Jede Formel hier
 * steht so in src/lib/finance.ts oder src/lib/lbo.ts und ist dort getestet —
 * wer die Rechnung ändert, ändert diese Seite mit.
 */
export default function MethodologyPage() {
  return (
    <div className="legal" lang="en">
      <header className="legal-head">
        <Link href="/" className="legal-back">← Back to DealDesk</Link>
        <h1>Methodology</h1>
        <p>What the workbench calculates, how the pieces fit together, and what it deliberately leaves out.</p>
      </header>
      <main className="legal-body">
        <section>
          <h2>Workflow</h2>
          <p>
            Every case runs through six steps: case setup, operating model, peer group, valuation,
            LBO and investment memo. All figures are in millions of the case currency. Cases live in
            your browser (localStorage); there is no account and no server-side storage.
          </p>
        </section>

        <section>
          <h2>1 · Operating model and free cash flow</h2>
          <p>
            Revenue compounds from the last reported (LTM or fiscal-year) base with a growth rate per
            year; EBITDA follows from a margin per year. D&amp;A, capex and the investment in net working
            capital are set as a share of revenue, tax as a rate on positive EBIT:
          </p>
          <pre className="formula">{`EBIT   = EBITDA − D&A
FCF    = EBIT − tax(EBIT) + D&A − Capex − ΔNWC
tax    = max(0, EBIT × t)`}</pre>
          <p>
            Scenarios shift the whole plan rather than single years: upside adds 3 pp growth and
            2 pp margin, downside takes away 4 pp and 3 pp. The sample cases start from company
            guidance or analyst consensus for the years where it exists and then fade growth in equal
            steps towards the terminal rate; the margin stays at the last supported level.
          </p>
        </section>

        <section>
          <h2>2 · Discounted cash flow</h2>
          <p>Five years of free cash flow are discounted at the WACC (end-of-year convention).
            The terminal value is calculated twice and averaged, so neither method alone drives the result:</p>
          <pre className="formula">{`TV_Gordon = FCF₅ × (1 + g) / (WACC − g)
TV_Exit   = EBITDA₅ × exit multiple
EV        = Σ FCFₜ / (1 + WACC)ᵗ + ½ (PV(TV_Gordon) + PV(TV_Exit))
Equity    = EV − net debt;  price per share = Equity / shares`}</pre>
          <p>
            The terminal value&apos;s share of EV is shown next to every result because it is the
            first thing to challenge. A WACC × terminal-growth grid and a two-way slider show how far
            the value moves.
          </p>
        </section>

        <section>
          <h2>3 · Trading comparables</h2>
          <p>
            Peers are suggested from the same or an adjacent sector and ranked by sub-sector and size.
            Only peers you tick count. EV/EBITDA multiples at or below zero or above 100x are listed but
            never enter the median — a company with near-zero EBITDA says nothing about value. If a sector
            offers fewer than two meaningful peers, the suggested set starts switched off rather than being
            filled with unrelated companies. Banks carry no EV/EBITDA: deposits are operating funding,
            not financial debt.
          </p>
          <pre className="formula">{`EV_Rev    = LTM revenue × median(peer EV/Revenue)
EV_EBITDA = LTM EBITDA  × median(peer EV/EBITDA)`}</pre>
          <p>The football field shows the interquartile range of each multiple next to the DCF scenario range.</p>
        </section>

        <section>
          <h2>4 · Blended value</h2>
          <p>
            The headline value is the equal-weighted mean of DCF EV, EV/Revenue and EV/EBITDA. Without
            included peers the DCF carries the value alone and the interface says so. For listed companies
            the implied price is compared with the market price; unlisted companies show the implied
            equity value instead, because there is no price to compare against.
          </p>
        </section>

        <section>
          <h2>5 · Leveraged buyout</h2>
          <p>
            The LBO buys the same business the model describes: LTM revenue and EBITDA, D&amp;A, capex,
            NWC and tax come from the case. The sponsor sets entry and exit multiple, the debt/equity
            split, cost of debt, hold period, growth and margin path. Defaults: a listed target is bought
            at its current market EV/EBITDA (before any premium), otherwise at the peer median; it is sold
            at the same multiple; debt is sized at 5.5x EBITDA.
          </p>
          <pre className="formula">{`Levered FCF = EBITDA − interest − tax − capex − ΔNWC
              → repays debt first, then builds cash
Exit equity = exit EBITDA × exit multiple − (debt − cash)
MOIC = exit equity / entry equity;  IRR = MOIC^(1/n) − 1`}</pre>
          <p>
            The value-creation bridge splits the gain into EBITDA growth, multiple change and
            deleveraging; the three parts add up exactly to the exit equity.
          </p>
        </section>

        <section>
          <h2>6 · Memo and exports</h2>
          <p>
            The memo and the co-pilot are generated by Claude when an API key is configured; otherwise
            they are assembled by rules from the model figures and are labelled as such. The prompt only
            contains the case data and asks the model not to add facts. Both exports are built in the
            browser: the Excel workbook holds the five-year model, DCF, comps, sensitivity, football field
            and LBO; the PowerPoint deck summarises the case for an investment committee.
          </p>
        </section>

        <section>
          <h2>Data</h2>
          <p>
            The market database is a snapshot of about 80 listed companies (Yahoo Finance, 23 November
            2026): price, shares, net debt, LTM revenue and EBITDA, and the consensus growth rate for
            the current fiscal year. Live quotes are fetched when the source responds and are otherwise
            replaced by the snapshot, which the interface marks as sample prices. Price charts come from
            TradingView and load only after you allow them. Stripe and OpenAI are unlisted;
            their figures are estimates from public reporting.
          </p>
        </section>

        <section>
          <h2>Known limitations</h2>
          <ul>
            <li>End-of-year discounting, a constant WACC and no explicit capital-structure changes in the DCF.</li>
            <li>Working-capital investment is a share of revenue, not a balance-sheet roll-forward.</li>
            <li>No adjustment for stock-based compensation, leases or minority interests in the equity bridge.</li>
            <li>The LBO has one debt tranche, no fees, no dividends and no minimum cash.</li>
            <li>EV/Revenue compares net-revenue and gross-revenue business models without adjustment.</li>
          </ul>
          <p>DealDesk is an educational project. Nothing on it is investment advice.</p>
        </section>
      </main>
      <footer className="legal-foot">
        <Link href="/methodology">Methodology</Link> · <Link href="/impressum">Impressum</Link> · <Link href="/datenschutz">Datenschutz</Link>
      </footer>
    </div>
  );
}
