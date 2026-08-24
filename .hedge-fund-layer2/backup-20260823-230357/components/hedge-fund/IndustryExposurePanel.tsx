import { getIndustryExposure } from "@/app/(app)/hedge-fund/industry-exposure/actions";

const BAR_COLORS = ["#8B5CF6", "#16D47B", "#F5A524", "#3B82F6", "#F04452", "#EC4899", "#14B8A6"];

/**
 * Real industry exposure across real Alpaca positions. Labeled
 * "Industry," not "Sector" -- see IndustryExposure.ts's docstring
 * for why: Finnhub's real finnhubIndustry classification is granular
 * (e.g. "Semiconductors"), not a broad GICS-style Sector taxonomy
 * (Technology/Healthcare/Energy), which no real data source in this
 * app provides. This answers the same real concentration-risk
 * question, just at the level of granularity actually available.
 *
 * Async Server Component, same pattern as SnapshotPanel/
 * OptionsChainPanel elsewhere in this app.
 */
export default async function IndustryExposurePanel() {
    const exposure = await getIndustryExposure();

    if (exposure.length === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h2 className="mb-2 text-sm font-semibold text-zinc-300">Industry Exposure</h2>
                <p className="text-xs text-zinc-600">No open positions to analyze.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-1 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">Industry Exposure</h2>
                <span className="text-[10px] text-zinc-600">Real, from live Alpaca positions</span>
            </div>
            <p className="mb-3 text-[10px] text-zinc-600">
                Real Finnhub industry classification per holding — not a broad Sector breakdown (Technology/Healthcare/Energy), which no real data source in this app provides yet.
            </p>
            <div className="space-y-2">
                {exposure.map((entry, i) => (
                    <div key={entry.industry}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-zinc-300">{entry.industry}</span>
                            <span className="text-zinc-500">
                                {entry.percentOfPortfolio.toFixed(1)}% · ${entry.marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} · {entry.tickers.join(", ")}
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div
                                className="h-full rounded-full"
                                style={{ width: `${entry.percentOfPortfolio}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
