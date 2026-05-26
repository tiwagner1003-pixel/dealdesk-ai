import { NextRequest, NextResponse } from "next/server";
import type { DataSourceNote } from "@/lib/types";

type TickerRow = {
  cik_str: number;
  ticker: string;
  title: string;
};

type SecFact = {
  val: number;
  fy?: number;
  fp?: string;
  form?: string;
  filed?: string;
  frame?: string;
};

const SEC_HEADERS = {
  "User-Agent": process.env.SEC_USER_AGENT || "DealDesk AI research prototype contact@example.com",
  "Accept-Encoding": "gzip, deflate",
};

const REVENUE_TAGS = [
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "Revenues",
  "SalesRevenueNet",
];

const NET_DEBT_TAGS = [
  "LongTermDebtAndFinanceLeaseObligationsCurrent",
  "LongTermDebtCurrent",
  "ShortTermBorrowings",
  "CommercialPaper",
  "LongTermDebtAndFinanceLeaseObligationsNoncurrent",
  "LongTermDebtNoncurrent",
  "CashAndCashEquivalentsAtCarryingValue",
  "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
  "MarketableSecuritiesCurrent",
  "MarketableSecuritiesNoncurrent",
  "ShortTermInvestments",
];

const SHARE_TAGS = [
  "EntityCommonStockSharesOutstanding",
  "WeightedAverageNumberOfDilutedSharesOutstanding",
  "WeightedAverageNumberOfSharesOutstandingDiluted",
];

function normalizeTicker(value: string) {
  return value.trim().toUpperCase().replace(/^\$/, "");
}

function cikPath(cik: number) {
  return String(cik).padStart(10, "0");
}

function latestAnnualFact(facts: Record<string, unknown>, tags: string[]) {
  for (const tag of tags) {
    const fact = facts[tag] as { units?: Record<string, SecFact[]> } | undefined;
    const units = fact?.units || {};
    const rows = Object.values(units)
      .flat()
      .filter((row) => typeof row.val === "number" && (row.form === "10-K" || row.form === "20-F" || row.fp === "FY"))
      .sort((a, b) => {
        const filed = String(b.filed || "").localeCompare(String(a.filed || ""));
        if (filed !== 0) return filed;
        return (b.fy || 0) - (a.fy || 0);
      });
    const row = rows[0];
    if (row) return { tag, row };
  }
  return null;
}

function latestBalanceFact(facts: Record<string, unknown>, tag: string) {
  const fact = facts[tag] as { units?: Record<string, SecFact[]> } | undefined;
  const rows = Object.values(fact?.units || {})
    .flat()
    .filter((row) => typeof row.val === "number")
    .sort((a, b) => String(b.filed || "").localeCompare(String(a.filed || "")));
  const row = rows[0];
  return row ? { tag, row } : null;
}

export async function GET(request: NextRequest) {
  const ticker = normalizeTicker(request.nextUrl.searchParams.get("ticker") || "");
  if (!ticker) {
    return NextResponse.json({ error: "ticker query parameter is required." }, { status: 400 });
  }

  try {
    const tickersRes = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: SEC_HEADERS,
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!tickersRes.ok) throw new Error(`SEC ticker lookup failed (${tickersRes.status}).`);

    const tickerMap = await tickersRes.json() as Record<string, TickerRow>;
    const match = Object.values(tickerMap).find((row) => normalizeTicker(row.ticker) === ticker);
    if (!match) {
      return NextResponse.json({
        error: `${ticker} was not found in SEC company tickers. Try a US-listed ticker such as AAPL or MSFT.`,
      }, { status: 404 });
    }

    const cik = cikPath(match.cik_str);
    const factsUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
    const factsRes = await fetch(factsUrl, {
      headers: SEC_HEADERS,
      next: { revalidate: 60 * 60 * 12 },
    });
    if (!factsRes.ok) throw new Error(`SEC company facts failed (${factsRes.status}).`);

    const data = await factsRes.json() as {
      entityName?: string;
      facts?: { "us-gaap"?: Record<string, unknown> };
    };
    const usGaap = data.facts?.["us-gaap"] || {};
    const revenue = latestAnnualFact(usGaap, REVENUE_TAGS);
    const shares = latestAnnualFact(usGaap, SHARE_TAGS) || latestBalanceFact(usGaap, "EntityCommonStockSharesOutstanding");

    const debtRows = NET_DEBT_TAGS
      .map((tag) => latestBalanceFact(usGaap, tag))
      .filter((row): row is { tag: string; row: SecFact } => Boolean(row));
    const cashRows = debtRows.filter((row) => {
      const tag = row.tag.toLowerCase();
      return tag.includes("cash") || tag.includes("marketablesecurities") || tag.includes("shortterminvestments");
    });
    const grossDebt = debtRows
      .filter((row) => {
        const tag = row.tag.toLowerCase();
        return !tag.includes("cash") && !tag.includes("marketablesecurities") && !tag.includes("shortterminvestments");
      })
      .reduce((sum, row) => sum + row.row.val, 0);
    const cash = cashRows.reduce((sum, row) => sum + row.row.val, 0);
    const netDebt = grossDebt - cash;

    const sourceUrl = `https://www.sec.gov/edgar/browse/?CIK=${match.cik_str}`;
    const source: DataSourceNote = {
      provider: "SEC EDGAR",
      label: `${match.title} company facts via SEC XBRL`,
      url: sourceUrl,
      fiscalYear: revenue?.row.fy,
      form: revenue?.row.form,
      confidence: revenue ? "high" : "medium",
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      company: {
        name: data.entityName || match.title,
        ticker: match.ticker,
        exchange: "SEC",
        region: "US",
        currency: "USD",
      },
      model: {
        revenue: revenue ? revenue.row.val / 1_000_000 : undefined,
        netDebt: Number.isFinite(netDebt) ? netDebt / 1_000_000 : undefined,
        shares: shares ? shares.row.val / 1_000_000 : undefined,
      },
      source,
      raw: {
        cik: match.cik_str,
        revenueTag: revenue?.tag,
        sharesTag: shares?.tag,
        debtTags: debtRows.map((row) => row.tag),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SEC data import failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
