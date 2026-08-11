import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

/**
 * From the mockup's "Snapshot" panel -- but only 2 of its 5 fields
 * are real. Quote (FinnhubQuoteProvider) has only price/change/
 * changePercent/previousClose -- no volume, no beta, no 52-week
 * range anywhere in this codebase. "Avg volume (30d)", "Beta (5y)",
 * and "52w range" are deliberately NOT shown here rather than
 * invented. Market Cap is derived (price × real sharesOutstanding),
 * not a separately-fetched number.
 */
export default function SnapshotPanel({ research }: WorkstationPanelProps) {
    const { quote, financialStatements } = research.report.evidence;
    const statements = financialStatements.statements.verified ? financialStatements.statements.value : [];
    const latest = statements.length > 0 ? [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear)[0] : null;

    const marketCap = quote.price.verified && latest
        ? quote.price.value * latest.sharesOutstanding
        : null;

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
            </div>
            <p className="mt-3 text-[10px] text-zinc-600">
                Avg volume, beta, and 52-week range aren&apos;t shown — no real data source for them exists yet.
            </p>
        </div>
    );
}
