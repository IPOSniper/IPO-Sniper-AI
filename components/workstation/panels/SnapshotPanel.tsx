import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

/**
 * From the mockup's "Snapshot" panel. Market cap and shares
 * outstanding were already real (derived from price × real
 * sharesOutstanding). Avg volume, beta, and 52-week range are now
 * ALSO real -- added after confirming Finnhub's /stock/metric
 * endpoint (metric=all) is already accessible on this account
 * elsewhere in this codebase (see FinnhubCandleProvider.ts's
 * comment, and its real use in FinnhubFinancialProvider.ts).
 *
 * Fetched directly here (async Server Component) rather than
 * threaded through EvidencePackage/the analyst pipeline -- these
 * three fields don't feed any analyst's recommendation, they're
 * purely a reference display, so adding a new evidence-package field
 * end-to-end for them would be more invasive than this is worth.
 * Same "fail closed to unverified" pattern as everywhere else in
 * this app: any missing field or failed fetch shows "—", never a
 * guessed number.
 *
 * NOT YET LIVE-TESTED. Written against Finnhub's documented
 * /stock/metric field names (beta, 52WeekHigh, 52WeekLow,
 * 10DayAverageTradingVolume) -- confirm these exact field names
 * still match Finnhub's current response the first time this runs
 * for real, since their docs can drift from what a live call
 * actually returns.
 */

interface MarketMetrics {
    beta: number | null;
    week52High: number | null;
    week52Low: number | null;
    avgVolume10Day: number | null;
}

async function fetchMarketMetrics(ticker: string): Promise<MarketMetrics> {
    const empty: MarketMetrics = { beta: null, week52High: null, week52Low: null, avgVolume10Day: null };

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return empty;

    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${apiKey}`,
            { next: { revalidate: 3600 } } // these move slowly -- 1hr cache is reasonable, not a live tape
        );
        if (!response.ok) return empty;

        const data = await response.json();
        const metric = data.metric ?? {};

        return {
            beta: typeof metric.beta === "number" ? metric.beta : null,
            week52High: typeof metric["52WeekHigh"] === "number" ? metric["52WeekHigh"] : null,
            week52Low: typeof metric["52WeekLow"] === "number" ? metric["52WeekLow"] : null,
            avgVolume10Day: typeof metric["10DayAverageTradingVolume"] === "number" ? metric["10DayAverageTradingVolume"] : null,
        };
    } catch {
        return empty;
    }
}

export default async function SnapshotPanel({ research }: WorkstationPanelProps) {
    const { quote, financialStatements, company } = research.report.evidence;
    const statements = financialStatements.statements.verified ? financialStatements.statements.value : [];
    const latest = statements.length > 0 ? [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear)[0] : null;

    const marketCap = quote.price.verified && latest
        ? quote.price.value * latest.sharesOutstanding
        : null;

    const metrics = await fetchMarketMetrics(company.ticker);
    const anyMetricAvailable = metrics.beta !== null || metrics.week52High !== null || metrics.avgVolume10Day !== null;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">Snapshot</h2>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-zinc-500">Market cap</span>
                    <span className="text-white">
                        {marketCap !== null ? `$${(marketCap / 1_000_000_000).toFixed(1)}B` : "—"}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Shares outstanding</span>
                    <span className="text-white">
                        {latest ? `${(latest.sharesOutstanding / 1_000_000).toFixed(1)}M` : "—"}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Avg volume (10d)</span>
                    <span className="text-white">
                        {metrics.avgVolume10Day !== null ? `${metrics.avgVolume10Day.toFixed(2)}M` : "—"}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Beta</span>
                    <span className="text-white">{metrics.beta !== null ? metrics.beta.toFixed(2) : "—"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">52-week range</span>
                    <span className="text-white">
                        {metrics.week52Low !== null && metrics.week52High !== null
                            ? `$${metrics.week52Low.toFixed(2)} – $${metrics.week52High.toFixed(2)}`
                            : "—"}
                    </span>
                </div>
            </div>
            {!anyMetricAvailable && (
                <p className="mt-3 text-[10px] text-zinc-600">
                    Avg volume, beta, and 52-week range unavailable — check FINNHUB_API_KEY / plan access to /stock/metric.
                </p>
            )}
        </div>
    );
}
